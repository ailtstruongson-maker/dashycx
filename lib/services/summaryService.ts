
import type { DataRow } from '../types';

export interface SummaryNode {
  name: string;
  quantity: number;
  revenue: number;
  revenueQD: number;
  children: Record<string, SummaryNode>;
}

/**
 * Chuyển đổi dữ liệu đơn hàng phẳng thành cấu trúc cây 2 cấp: Ngành hàng -> Nhóm hàng
 */
export function buildSummaryTree(rows: DataRow[]) {
  const tree: Record<string, SummaryNode> = {};

  rows.forEach(row => {
    const industry = (row['Ngành hàng'] || 'Khác').toString();
    const group = (row['Nhóm hàng'] || 'Khác').toString();
    const qty = parseFloat(row['Số lượng']) || 0;
    const rev = row.computedRevenue || 0;
    const revQD = row.computedRevenueQD || 0;

    // 1. Cấp Ngành hàng
    if (!tree[industry]) {
      tree[industry] = { name: industry, quantity: 0, revenue: 0, revenueQD: 0, children: {} };
    }
    const indNode = tree[industry];
    indNode.quantity += qty;
    indNode.revenue += rev;
    indNode.revenueQD += revQD;

    // 2. Cấp Nhóm hàng
    if (!indNode.children[group]) {
      indNode.children[group] = { name: group, quantity: 0, revenue: 0, revenueQD: 0, children: {} };
    }
    const grpNode = indNode.children[group];
    grpNode.quantity += qty;
    grpNode.revenue += rev;
    grpNode.revenueQD += revQD;
  });

  return tree;
}
