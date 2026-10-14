export default async function handler(req, res) {
  // 防止别人白嫖：要求带 token
  if (req.query.token !== process.env.TOKEN) return res.status(403).send('forbidden');

  // 取 url= 后面的全部内容（订阅链接里自带的 & 参数也不会被截断）
  const i = req.url.indexOf('url=');
  if (i < 0) return res.status(400).send('missing url');
  let target = req.url.slice(i + 4);
  if (/^https?%3A/i.test(target)) target = decodeURIComponent(target);
  if (!/^https?:\/\//i.test(target)) return res.status(400).send('bad url');

  const r = await fetch(target, {
    headers: { 'User-Agent': req.headers['user-agent'] || 'clash.meta' },
    redirect: 'follow',
  });
  // 透传流量/到期信息等头，MiSub 才能显示剩余流量
  for (const h of ['content-type', 'subscription-userinfo', 'content-disposition', 'profile-update-interval']) {
    const v = r.headers.get(h);
    if (v) res.setHeader(h, v);
  }
  res.status(r.status).send(Buffer.from(await r.arrayBuffer()));
}