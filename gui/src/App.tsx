import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { markdown as markdownLang } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { mdToResume, renderResumeMarkdown } from "./utils";

const PANE_PADDING = 32;
const PORTFOLIO_URL = "https://gerardconsuelo.com/latest-json";
const PORTFOLIO_TOKEN = import.meta.env.VITE_PORTFOLIO_TOKEN;

export default function App() {
  const [markdown, setMarkdown] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportingPortfolio, setExportingPortfolio] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const paneRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [frame, setFrame] = useState({ width: 0, height: 0, scale: 1 });
  const [editorWidth, setEditorWidth] = useState(520);
  const [] = useState(70);

  const html = useMemo(() => renderResumeMarkdown(markdown), [markdown]);

  useEffect(() => {
    fetch("/template.md")
      .then((res) => res.text())
      .then(setMarkdown)
      .catch(() => setMarkdown("# Failed to load template.md"));
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!draggingRef.current || !layoutRef.current) return;
      const rect = layoutRef.current.getBoundingClientRect();
      const min = 280;
      const max = rect.width - 320;
      const next = Math.min(Math.max(e.clientX - rect.left, min), max);
      setEditorWidth(next);
    };
    const onMouseUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const startResize = () => {
    draggingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  useLayoutEffect(() => {
    const pane = paneRef.current;
    const page = previewRef.current;
    if (!pane || !page) return;

    const recompute = () => {
      const availW = pane.clientWidth - PANE_PADDING * 2;
      const availH = pane.clientHeight - PANE_PADDING * 2;
      const natW = page.offsetWidth;
      const natH = page.offsetHeight;
      if (!natW || !natH) return;
      const scale = Math.min(availW / natW, availH / natH, 1);
      setFrame({ width: natW * scale, height: natH * scale, scale });
    };

    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(pane);
    ro.observe(page);
    return () => ro.disconnect();
  }, [html]);

  const exportPdf = async () => {
    const node = previewRef.current;
    if (!node) return;
    setExporting(true);
    const prevTransform = node.style.transform;
    node.style.transform = "none";
    try {
      const canvas = await html2canvas(node, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save("resume.pdf");
    } finally {
      node.style.transform = prevTransform;
      setExporting(false);
    }
  };

  const exportToPortfolio = async () => {
    setExportingPortfolio(true);
    try {
      const resume = mdToResume(markdown);
      const res = await fetch(PORTFOLIO_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${PORTFOLIO_TOKEN}`,
        },
        body: JSON.stringify(resume),
      });
      if (!res.ok) {
        console.error("Export to portfolio failed: " + res.statusText);
      }
    } finally {
      setExportingPortfolio(false);
    }
  };

  return (
    <div className="app">
      <header className="topbar">
        <h1>Resume Builder</h1>
        <div>
        <button className="export-btn" onClick={exportToPortfolio} disabled={exportingPortfolio}>
          {exportingPortfolio ? "Exporting…" : "Export to Portfolio"}
        </button>
        <button className="export-btn" onClick={exportPdf} disabled={exporting}>
          {exporting ? "Exporting…" : "Export to PDF"}
        </button>
        </div>
      
      </header>

      <div className="layout" ref={layoutRef}>
        <section className="editor" style={{ width: editorWidth }}>
          <CodeMirror
            className="md-editor"
            value={markdown}
            onChange={(value) => setMarkdown(value)}
            theme={oneDark}
            extensions={[markdownLang()]}
            basicSetup={{ lineNumbers: true, foldGutter: false }}
          />
        </section>

        <div className="resizer" onMouseDown={startResize} />

        <section className="preview-pane" ref={paneRef}>
          <div className="page-frame" style={{ width: frame.width, height: frame.height }}>
            <div
              className="preview-page"
              ref={previewRef}
              style={{ transform: `scale(${frame.scale})` }}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
