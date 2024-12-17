const screenshot = require('screenshot-desktop');
const fs = require('fs');

const takeScreenshot = async function () {
  try {
    const img = await screenshot({ format: 'jpg' });
    fs.writeFileSync('screenshot12.jpg', img);
    console.log('Screenshot saved as screenshot1.jpg');
    return { status: 'success', message: 'Screenshot saved' };
  } catch (err) {
    console.error('Error taking screenshot:', err);
    return { status: 'error', message: `Error taking screenshot: ${err.message}` };
  }
};

module.exports = { takeScreenshot };