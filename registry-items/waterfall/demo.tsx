import * as React from "react";
import { Waterfall } from "@/components/ui/waterfall";

type Pic = { id: number; src: string; height: number };

/** 生成内联 SVG 占位图（零外网） */
function svg(w: number, h: number, i: number) {
  const c = `hsl(${(i * 47) % 360} 70% 55%)`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="${c}"/><text x="50%" y="50%" fill="#fff" font-size="24" text-anchor="middle" dominant-baseline="middle">#${i}</text></svg>`
  )}`;
}

const DATA: Pic[] = Array.from({ length: 12 }, (_, i) => {
  const height = 120 + ((i * 137) % 200);
  return { id: i + 1, height, src: svg(240, height, i + 1) };
});

export default function Demo() {
  const [pics, setPics] = React.useState(DATA);
  const [end, setEnd] = React.useState(false);
  return (
    <Waterfall
      data={pics as unknown as Record<string, unknown>[]}
      width={220}
      gap={16}
      end={end}
      props={{ src: "src", height: "height" }}
      onLoadMore={() => {
        setPics((p) => [...p, ...DATA.map((d) => ({ ...d, id: d.id + p.length }))]);
        setEnd(true);
      }}
    />
  );
}
