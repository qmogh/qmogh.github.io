import { writeFileSync } from 'node:fs';

const res = await fetch('https://dotcombubble.substack.com/feed', { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; amogh.sh feed fetcher)' } });
if (!res.ok) throw new Error(`feed ${res.status}`);
const xml = await res.text();
const tag = (s, t) => (s.match(new RegExp(`<${t}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${t}>`)) || [])[1]?.trim() || '';
const posts = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
  .map(([, i]) => ({ title: tag(i, 'title'), subtitle: tag(i, 'description'), date: new Date(tag(i, 'pubDate')).toISOString(), url: tag(i, 'link') }))
  .sort((a, b) => b.date.localeCompare(a.date));
if (!posts.length) throw new Error('no posts parsed');
writeFileSync('data/posts.json', JSON.stringify(posts, null, 2) + '\n');
