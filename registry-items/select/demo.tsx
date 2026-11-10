import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export default function Demo() {
  return (
    <div className="grid max-w-sm gap-4">
      <Select defaultValue="tiktok">
        <SelectTrigger><SelectValue placeholder="选择平台" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="tiktok">TikTok Shop</SelectItem>
          <SelectItem value="amazon">Amazon</SelectItem>
          <SelectItem value="temu">Temu</SelectItem>
        </SelectContent>
      </Select>
      <Select defaultValue="worker">
        <SelectTrigger><SelectValue placeholder="选择角色" /></SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>执行类</SelectLabel>
            <SelectItem value="worker">worker</SelectItem>
            <SelectItem value="specialist">specialist</SelectItem>
          </SelectGroup>
          <SelectGroup>
            <SelectLabel>管理类</SelectLabel>
            <SelectItem value="project_manager">project_manager</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
