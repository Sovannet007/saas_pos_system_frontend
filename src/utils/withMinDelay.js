export async function withMinDelay(promise, ms = 2000) {
  const [res] = await Promise.all([
    promise,
    new Promise((r) => setTimeout(r, ms)),
  ]);
  return res;
}
