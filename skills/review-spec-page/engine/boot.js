/* Spec page start-up. Order matters: ids exist before cross-references resolve to them,
   and the review controls go on after linkify so it never walks into them.
   A spec's own widgets.js can set window.SpecPage.extras = { prepare(), start() }:
   prepare runs after items are found and before links are made, start after the page is built. */
(() => {
  'use strict';
  const P = window.SpecPage;
  const x = P.extras || {};
  P.sectionize();
  P.review.collect();
  if (x.prepare) x.prepare();
  P.linkify(P.spec);
  P.linkify(P.$('.glance'));
  P.review.mount();
  P.buildToc();
  P.review.summarize();
  P.wire();
  P.review.wire();
  if (x.start) x.start();
  P.openHash();
})();
