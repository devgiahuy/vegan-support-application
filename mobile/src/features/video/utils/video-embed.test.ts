/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildFileVideoHtml, buildYoutubeEmbedHtml, extractYoutubeId, resolveVideoEmbed } from './video-embed';

test('YouTube ids are extracted from watch, short, embed and shorts links', () => {
  assert.equal(extractYoutubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10'), 'dQw4w9WgXcQ');
  assert.equal(extractYoutubeId('https://youtu.be/dQw4w9WgXcQ?si=abc'), 'dQw4w9WgXcQ');
  assert.equal(extractYoutubeId('https://www.youtube.com/embed/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.equal(extractYoutubeId('https://m.youtube.com/shorts/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.equal(extractYoutubeId('https://www.youtube.com/watch?v=short'), null);
  assert.equal(extractYoutubeId('https://evil.example/watch?v=dQw4w9WgXcQ'), null);
  assert.equal(extractYoutubeId('not a url'), null);
});

test('YouTube links embed through youtube-nocookie and a broken YouTube link is invalid', () => {
  const embed = resolveVideoEmbed('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  assert.equal(embed.kind, 'youtube');
  if (embed.kind === 'youtube') {
    assert.match(embed.embedUrl, /^https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ\?/);
    assert.equal(embed.watchUrl, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  }
  assert.equal(resolveVideoEmbed('https://www.youtube.com/watch?v=bad').kind, 'invalid');
  assert.equal(resolveVideoEmbed('https://cdn.example/clip.mp4', 'YOUTUBE').kind, 'invalid');
});

test('uploaded files play with the video tag, but only over https', () => {
  assert.deepEqual(resolveVideoEmbed('https://res.cloudinary.com/demo/video/upload/clip.mp4', 'CLOUDINARY'), {
    kind: 'file',
    url: 'https://res.cloudinary.com/demo/video/upload/clip.mp4',
  });
  assert.equal(resolveVideoEmbed('http://res.cloudinary.com/demo/clip.mp4').kind, 'invalid');
  assert.equal(resolveVideoEmbed('javascript:alert(1)').kind, 'invalid');
  assert.equal(resolveVideoEmbed('').kind, 'invalid');
});

test('generated HTML escapes attribute values and ignores non-https posters', () => {
  const html = buildFileVideoHtml('https://cdn.example/a.mp4?x="><script>', 'http://insecure/poster.jpg');
  assert.ok(!html.includes('"><script>'));
  assert.ok(html.includes('&quot;&gt;&lt;script&gt;'));
  assert.ok(!html.includes('poster='));
  assert.ok(buildFileVideoHtml('https://cdn.example/a.mp4', 'https://cdn.example/p.jpg').includes('poster="https://cdn.example/p.jpg"'));
  assert.ok(buildYoutubeEmbedHtml('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', 'A "title"').includes('title="A &quot;title&quot;"'));
});
