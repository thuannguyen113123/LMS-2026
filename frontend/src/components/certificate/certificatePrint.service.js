export const printElement = (element) => {
  if (!element) return;

  const printWindow = window.open("", "_blank");

  printWindow.document.write(`
      <html>
        <head>
          <title>Certificate</title>
          <link rel="stylesheet" href="/certificate.print.css" />
        </head>
        <body>
          ${element.outerHTML}
        </body>
      </html>
    `);

  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
};
