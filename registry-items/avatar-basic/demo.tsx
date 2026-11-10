import { Avatar } from "./index";

export default function Demo() {
  return (
    <div className="flex items-center gap-4">
      <Avatar fallback="Feng Xiang" />
      <Avatar fallback="ShardKit" className="h-12 w-12" />
      <Avatar src="https://avatars.githubusercontent.com/u/9919?v=4" fallback="GT" />
      <Avatar fallback="A" className="h-8 w-8" />
      {/* 无 src → 自动回退到首字母 */}
      <Avatar alt="No Image" />
    </div>
  );
}
