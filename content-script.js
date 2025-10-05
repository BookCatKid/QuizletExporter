(async () => {
    try {
        const url = location.href;
        const idMatch = url.match(/quizlet\.com\/(?:[^\d]*)(\d{6,})/);
        let setId = idMatch ? idMatch[1] : null;

        if (!setId) throw new Error("Could not find set id in URL");

        // Fetch pages until there are no more studiableItem entries.
        const base = `https://quizlet.com/webapi/3.4/studiable-item-documents?perPage=9999&filters[studiableContainerId]=${setId}&filters[studiableContainerType]=1`;
        let page = 1;
        let pagingToken = null;
        let combinedItems = [];
        let lastResponse = null;

        while (true) {
            let apiUrl = base + `&page=${page}`;
            if (pagingToken) apiUrl += `&pagingToken=${encodeURIComponent(pagingToken)}`;

            const resp = await fetch(apiUrl, { credentials: "include" });
            if (resp.status === 410) break;
            if (!resp.ok) throw new Error("Failed to fetch Quizlet API: " + resp.status);
            const data = await resp.json();

            // extract items for this page and append into combinedItems
            const items = data?.responses?.[0]?.models?.studiableItem || [];
            console.log('Fetched page', page, 'items:', items.length, "pagingToken:", pagingToken);
            if (!items || items.length === 0) break;
            combinedItems.push(...items);

            // keep last response for paging metadata
            lastResponse = data;

            if (data?.responses?.[0]?.paging?.token) {
                pagingToken = data.responses[0].paging.token;
                page += 1;
                continue;
            }

            // No paging token present; we've already appended items, so treat this as final page.
            break;
        }

        const csv = jsonToCsv(combinedItems);
        const filename = `quizlet-set-${setId}`;
        const count = countTerms(combinedItems);
        // read requested output format set by the popup (if any)
        const format = window.__quizletExporterFormat || null;
        chrome.runtime.sendMessage({
            type: "csv-result",
            csv,
            filename,
            count,
            format,
        });
    } catch (err) {
        chrome.runtime.sendMessage({ type: "csv-error", error: err.message });
    }

    function jsonToCsv(items) {
        if (!Array.isArray(items)) {
            console.warn('jsonToCsv: expected an array of studiableItem entries');
            items = [];
        }
        const rows = [];
        for (const item of items) {
            if (item.isDeleted) continue;
            // cardSides contains two sides with labels like 'word' and 'definition' (or other)
            const sides = item.cardSides || [];
            // Determine question and answer: prefer side with label 'word' as question and 'definition' as answer, fallback to sideId 0/1
            let q = "",
                a = "";
            const wordSide = sides.find((s) => /word/i.test(s.label));
            const defSide = sides.find((s) => /defin/i.test(s.label));
            if (wordSide && defSide) {
                q = (wordSide.media || []).find(x => x && x.type === 1)?.plainText || '';
                a = (defSide.media || []).find(x => x && x.type === 1)?.plainText || '';
            } else if (sides.length >= 2) {
                q = (sides[0].media || []).find(x => x && x.type === 1)?.plainText || '';
                a = (sides[1].media || []).find(x => x && x.type === 1)?.plainText || '';
            } else {
                q = (sides[0] && sides[0].media || []).find(x => x && x.type === 1)?.plainText || '';
            }

            rows.push([q, a].map(escapeCsv));
        }

        const header = ['"question"', '"answer"'].join(",");
        const body = rows.map((r) => r.join(",")).join("\n");
        return header + "\n" + body + "\n";

        function escapeCsv(s) {
            if (s == null) s = "";
            // wrap in double quotes and escape any existing double quotes by doubling
            return '"' + String(s).replace(/"/g, '""') + '"';
        }
    }

    function countTerms(items) {
        return Array.isArray(items) ? items.length : 0;
    }
})();
