/**
 * 案例索引页（首页）—— ShardKit 的入口
 *
 * 形态（2026-09-16 维护者二次纠偏后）：像一套后台应用的总览页。
 *   - 上半：页面案例卡（点开即见整页效果）
 *   - 下半：功能特性说明（不是给人类程序员的零件索引）
 *
 * 受众：本 demo 面向 Agent。每个案例都是与真实应用一致的完整页面，
 * 直接读案例页源码即知其用法；不提供「取用/元数据」类辅助 UI。
 */
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Sparkles, Package, Terminal, Layers, MousePointerClick } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ContentFrame } from "@/components/ui/content-frame";
import { registryMeta } from "@/lib/registry";
import { CASES, caseTitle, caseDesc } from "@/lib/cases";

export default function IndexPage() {
  const { t, i18n } = useTranslation();
  const meta = registryMeta();

  return (
    <div data-testid="index-page" className="flex flex-col">
      <ContentFrame>
      {/* 导航已说明「这是案例索引」，故不留页头；说明文字降到框内首行 */}
      <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="text-sm text-muted-foreground">{t("index.description")}</p>
      </div>

      <div className="mb-4 flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-muted-foreground">
          {t("index.tip1")}<b className="text-foreground">{t("index.tip2")}</b>
          {t("index.tip3")}<b className="text-foreground">{t("index.tip4")}</b>{t("index.tip5")}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {CASES.map((c) => (
          <Link key={c.to} to={c.to} className="group" data-testid={`case-${c.id}`}>
            <Card className="h-full transition-all hover:border-primary/40 hover:shadow-md">
              <div className={`flex h-28 items-center justify-center rounded-t-xl bg-gradient-to-br ${c.tone}`}>
                <c.icon className="h-9 w-9 text-foreground/70 transition-transform group-hover:scale-110" />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  {caseTitle(c, i18n.language)}
                  <ArrowRight className="h-4 w-4 -translate-x-1 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                </CardTitle>
                <CardDescription>{caseDesc(c, i18n.language)}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1.5">
                {c.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="font-normal">{tag}</Badge>
                ))}
                <Badge variant="outline" className="ml-auto font-normal">
                  {c.kind === "block" ? t("index.kindBlock") : t("index.kindPage")}
                </Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* 特性说明（面向 Agent 的用法说明，而非零件索引） */}
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          { icon: Sparkles, key: "feat1" },
          { icon: MousePointerClick, key: "feat2" },
          { icon: Layers, key: "feat3" },
        ].map((f) => (
          <Card key={f.key}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <f.icon className="h-4 w-4 text-primary" /> {t(`index.${f.key}Title`)}
              </CardTitle>
              <CardDescription>{t(`index.${f.key}Desc`)}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-2">
          <Package className="h-4 w-4" /> {t("index.stats", { cases: CASES.length, registry: meta.count })}
        </span>
        <Badge variant="info" className="font-normal">
          <Terminal className="mr-1 h-3 w-3" /> React + Refine + Tailwind + shadcn
        </Badge>
      </div>
      </ContentFrame>
    </div>
  );
}
