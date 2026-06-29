/**
 * Upload file-type filter — uploads (profile pics, donation images, KYC docs)
 * must be images only. An arbitrary file (script, PDF, HTML) must be rejected
 * before it ever reaches Cloudinary or disk.
 */
const { imageFileFilter } = require("../config/cloudinary");

function runFilter(mimetype) {
  return new Promise((resolve) => {
    imageFileFilter({}, { mimetype }, (err, accepted) => resolve({ err, accepted }));
  });
}

test("accepts common image types", async () => {
  for (const type of ["image/jpeg", "image/png", "image/webp", "image/gif"]) {
    const { err, accepted } = await runFilter(type);
    expect(err).toBeFalsy();
    expect(accepted).toBe(true);
  }
});

test("rejects non-image files with a 400", async () => {
  for (const type of ["application/pdf", "application/octet-stream", "text/html", "application/x-msdownload"]) {
    const { err } = await runFilter(type);
    expect(err).toBeInstanceOf(Error);
    expect(err.status).toBe(400);
  }
});
