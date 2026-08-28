export const publicCacheControl = (maxAgeSeconds = 60) => {
  return (req, res, next) => {
    if (req.method === 'GET') {
      res.set('Cache-Control', `public, max-age=${maxAgeSeconds}, s-maxage=${maxAgeSeconds}, stale-while-revalidate=30`);
    } else {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    }
    next();
  };
};