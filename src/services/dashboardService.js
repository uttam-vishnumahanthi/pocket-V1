const { getDb } = require('../db/connection');
const { paiseToRupees } = require('../utils/currency');
const profileService = require('./profileService');

const CATEGORY_LABELS = {
  food: 'Food & dining',
  transport: 'Transport',
  shopping: 'Shopping',
  entertainment: 'Entertainment',
  utilities: 'Utilities',
  groceries: 'Groceries',
  others: 'Others'
};

class DashboardService {
  getSummary(now = new Date()) {
    const db = getDb();
    const currentMonth = now.getMonth(); // 0-11
    const currentYear = now.getFullYear();

    // 1. Total all-time Income
    const incomeRow = db.prepare(`SELECT COALESCE(SUM(amount_paise), 0) as total FROM income`).get();
    const totalIncomePaise = Number(incomeRow.total || 0);

    // 2. Total all-time Expenses
    const expenseRow = db.prepare(`SELECT COALESCE(SUM(amount_paise), 0) as total FROM expenses`).get();
    const totalExpensesPaise = Number(expenseRow.total || 0);

    // 3. Current Balance
    const currentBalancePaise = totalIncomePaise - totalExpensesPaise;

    // 4. Monthly Spending (Current Month & Last Month for MoM growth rate)
    const allExpenses = db.prepare(`SELECT amount_paise, datetime, category, type FROM expenses`).all();

    let monthlySpentPaise = 0;
    let lastMonthSpentPaise = 0;

    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    let needsTotalPaise = 0;
    let wantsTotalPaise = 0;
    const categoryMap = {};

    allExpenses.forEach(exp => {
      const dt = new Date(exp.datetime);
      const m = dt.getMonth();
      const y = dt.getFullYear();

      if (m === currentMonth && y === currentYear) {
        monthlySpentPaise += exp.amount_paise;
      }

      if (m === lastMonth && y === lastMonthYear) {
        lastMonthSpentPaise += exp.amount_paise;
      }

      // Needs vs Wants calculation
      if (exp.type === 'need') {
        needsTotalPaise += exp.amount_paise;
      } else if (exp.type === 'want') {
        wantsTotalPaise += exp.amount_paise;
      }

      // Category map
      categoryMap[exp.category] = (categoryMap[exp.category] || 0) + exp.amount_paise;
    });

    // Month-over-month growth rate
    let growthRate = null;
    let growthRateFormatted = 'No spending yet';
    if (lastMonthSpentPaise > 0) {
      const diff = monthlySpentPaise - lastMonthSpentPaise;
      growthRate = Math.round((diff / lastMonthSpentPaise) * 1000) / 10; // e.g. +8.4%
      growthRateFormatted = `${growthRate >= 0 ? '+' : ''}${growthRate}% vs last month`;
    } else if (monthlySpentPaise > 0) {
      growthRateFormatted = 'Simple tracking active';
    }

    // Savings percentage
    const netSavingsPaise = totalIncomePaise - totalExpensesPaise;
    const savingsPercentage = totalIncomePaise > 0 ? Math.round((netSavingsPaise / totalIncomePaise) * 100) : 0;

    // Needs vs Wants percentage
    const needsPercentage = totalExpensesPaise > 0 ? Math.round((needsTotalPaise / totalExpensesPaise) * 100) : 50;
    const wantsPercentage = totalExpensesPaise > 0 ? Math.round((wantsTotalPaise / totalExpensesPaise) * 100) : 50;

    // Category breakdown list
    const categories = Object.keys(categoryMap).map(cat => ({
      category: cat,
      label: CATEGORY_LABELS[cat] || cat,
      amount: paiseToRupees(categoryMap[cat]),
      amountPaise: categoryMap[cat],
      percentage: totalExpensesPaise > 0 ? Math.round((categoryMap[cat] / totalExpensesPaise) * 100) : 0
    })).sort((a, b) => b.amountPaise - a.amountPaise);

    // 5. Debts and People Summary
    const peopleRows = db.prepare(`SELECT * FROM people ORDER BY date DESC`).all();
    let totalIOwePaise = 0;
    let totalOwedPaise = 0;
    const activeIOweList = [];
    const activeOwedList = [];

    peopleRows.forEach(p => {
      const remainingPaise = Math.max(0, p.amount_paise - (p.repaid_amount_paise || 0));
      if (remainingPaise > 0) {
        const item = {
          id: p.id,
          person: p.person,
          amount: paiseToRupees(p.amount_paise),
          repaidAmount: paiseToRupees(p.repaid_amount_paise || 0),
          remaining: paiseToRupees(remainingPaise),
          remainingPaise: remainingPaise,
          date: p.date,
          note: p.note || '',
          type: p.type
        };

        if (p.type === 'borrowed') {
          totalIOwePaise += remainingPaise;
          activeIOweList.push(item);
        } else if (p.type === 'spent') {
          totalOwedPaise += remainingPaise;
          activeOwedList.push(item);
        }
      }
    });

    const netDebtBalancePaise = totalOwedPaise - totalIOwePaise;

    // 6. User Profile
    const profile = profileService.getProfile();

    return {
      currentBalance: paiseToRupees(currentBalancePaise),
      currentBalancePaise,
      totalIncome: paiseToRupees(totalIncomePaise),
      totalIncomePaise,
      totalExpenses: paiseToRupees(totalExpensesPaise),
      totalExpensesPaise,
      monthlySpent: paiseToRupees(monthlySpentPaise),
      monthlySpentPaise,
      lastMonthSpent: paiseToRupees(lastMonthSpentPaise),
      lastMonthSpentPaise,
      growthRate,
      growthRateFormatted,
      netSavings: paiseToRupees(netSavingsPaise),
      netSavingsPaise,
      savingsPercentage,
      needsPercentage,
      wantsPercentage,
      categories,
      debts: {
        totalIOwe: paiseToRupees(totalIOwePaise),
        totalIOwePaise,
        totalOwed: paiseToRupees(totalOwedPaise),
        totalOwedPaise,
        netBalance: paiseToRupees(Math.abs(netDebtBalancePaise)),
        netBalancePaise: netDebtBalancePaise,
        isOwedToMe: netDebtBalancePaise >= 0,
        activeIOweList,
        activeOwedList
      },
      user: profile
    };
  }
}

module.exports = new DashboardService();
