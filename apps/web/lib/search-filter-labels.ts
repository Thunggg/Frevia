/**
 * Ánh xạ giá trị filter trên URL sang key dịch trong namespace "findWork".
 *
 * Dùng chung cho trang Find Work và các bề mặt hiển thị lại filter đã lưu
 * (saved searches) để nhãn ở hai nơi không bị lệch nhau khi từ điển thay đổi.
 */
export const BUDGET_KEYS: Record<string, string> = {
  "under-500": "budget.under500",
  "500-1000": "budget.500to1000",
  "1000-5000": "budget.1000to5000",
  "5000-plus": "budget.over5000",
};

export const TIME_KEYS: Record<string, string> = {
  today: "time.today",
  "last-3-days": "time.last3Days",
  "last-7-days": "time.last7Days",
  "last-30-days": "time.last30Days",
};

export const SORT_KEYS: Record<string, string> = {
  newest: "sort.newest",
  oldest: "sort.oldest",
  "title-asc": "sort.titleAsc",
  "title-desc": "sort.titleDesc",
  "budget-low": "sort.budgetLow",
  "budget-high": "sort.budgetHigh",
};

/**
 * Dịch một giá trị filter đã lưu.
 *
 * Giá trị lạ (ví dụ filter cũ đã đổi tên) được hiển thị dạng đọc được bằng cách
 * thay dấu gạch nối bằng khoảng trắng, thay vì để lộ chuỗi thô như "under-500".
 */
export function translateFilterOption(
  t: (key: string) => string,
  keys: Record<string, string>,
  value: string,
): string {
  const key = keys[value];
  return key ? t(key) : value.replaceAll("-", " ");
}
