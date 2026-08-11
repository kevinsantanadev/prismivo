import assert from "node:assert/strict";
import test from "node:test";

test("renders Prismivo production metadata without development markers", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  const html = await response.text();
  assert.match(html, /<title>Prismivo \| Client operations, finalmente claras<\/title>/i);
  assert.match(html, /<link[^>]+rel=["']canonical["'][^>]+prismivo\.kevinsantanadev\.com\.br/i);
  assert.doesNotMatch(html, /<meta[^>]+name=["'][^"']*preview/i);
});

test("renders every public legal document with its current revision", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("legal-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const env = {
    ASSETS: {
      fetch: async () => new Response("Not found", { status: 404 }),
    },
  };
  const ctx = { waitUntil() {}, passThroughOnException() {} };

  for (const slug of ["termos", "privacidade", "cookies", "cancelamento", "acessibilidade", "seguranca"]) {
    const response = await worker.fetch(
      new Request(`http://localhost/legal/${slug}`, { headers: { accept: "text/html" } }),
      env,
      ctx,
    );
    assert.equal(response.status, 200, `legal page ${slug}`);
    const html = await response.text();
    assert.match(html, /10 de agosto de 2026/i);
    assert.match(html, new RegExp(`/legal/${slug}`));
  }
});
