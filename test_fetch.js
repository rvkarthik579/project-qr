async function run() {
  try {
    const res = await fetch('http://localhost:3000/api/qr/scan/QR-FAKE123', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Body:", text);
  } catch (err) {
    console.error(err);
  }
}
run();
