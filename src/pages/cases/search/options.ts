/**
 * 查询案例 · 数据层
 * mock：异步拉取下拉选项（对齐 vue-admin-tpl getDictOneApi 动态选项演示）
 */
export interface Option {
  label: string;
  value: string;
}

/** 模拟远程字典接口（延迟 300ms） */
export function mockFetchOptions(): Promise<Option[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { label: "行业-金融", value: "fin" },
        { label: "行业-制造", value: "mfg" },
        { label: "行业-零售", value: "retail" },
        { label: "行业-医药", value: "pharma" },
      ]);
    }, 300);
  });
}
