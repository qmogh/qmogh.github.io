import { writeFileSync } from 'node:fs';

const xml = await (await fetch('https://dotcombubble.substack.com/feed')).text();
const tag = (s, t) => (s.match(new RegExp(`<${t}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${t}>`)) || [])[1]?.trim() || '';
const posts = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
  .map(([, i]) => ({ title: tag(i, 'title'), subtitle: tag(i, 'description'), date: new Date(tag(i, 'pubDate')).toISOString(), url: tag(i, 'link') }))
  .sort((a, b) => b.date.localeCompare(a.date));
if (!posts.length) throw new Error('no posts parsed');
writeFileSync('data/posts.json', JSON.stringify(posts, null, 2) + '\n');
