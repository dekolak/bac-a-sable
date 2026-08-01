import { prisma } from "@/lib/prisma";
import { NO_CACHE_HEADERS } from "@/lib/no-cache";

export const dynamic = "force-dynamic";

// Petit script d'intégration : à coller sur un site externe.
//   <div id="bloc-xxx"></div>
//   <script src=".../outils/xxx/embed.js" data-cible="#bloc-xxx"></script>
// Il injecte une iframe vers la route /embed et gère l'auto-resize.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const bloc = await prisma.bloc.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!bloc) {
    return new Response("// bloc introuvable", {
      status: 404,
      headers: { "content-type": "application/javascript; charset=utf-8" },
    });
  }

  const js = `(function () {
  var s = document.currentScript;
  if (!s) return;
  var base = s.src.replace(/\\/embed\\.js.*$/, "");
  var slug = ${JSON.stringify(slug)};
  var sel = s.getAttribute("data-cible");
  var mount = sel ? document.querySelector(sel) : null;

  var iframe = document.createElement("iframe");
  iframe.src = base + "/embed";
  iframe.setAttribute("sandbox", "allow-scripts allow-forms allow-popups");
  iframe.style.width = "100%";
  iframe.style.border = "0";
  iframe.style.display = "block";
  iframe.style.height = "300px";
  iframe.setAttribute("loading", "lazy");

  if (mount) mount.appendChild(iframe);
  else if (s.parentNode) s.parentNode.insertBefore(iframe, s.nextSibling);

  window.addEventListener("message", function (e) {
    var d = e.data;
    if (d && d.type === "bloc:height" && d.slug === slug && d.height) {
      iframe.style.height = d.height + "px";
    }
  });
})();`;

  return new Response(js, {
    headers: {
      "content-type": "application/javascript; charset=utf-8",
      ...NO_CACHE_HEADERS,
    },
  });
}
