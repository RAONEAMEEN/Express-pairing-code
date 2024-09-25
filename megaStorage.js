import { mega } from 'megajs';
import fs from 'fs';

const email = 'ameenxnt@gmail.com';
const password = 'meeramimmi';

const storage = mega({
  email: email,
  password: password,
  keepalive: false
}, () => {
  console.log('Logged in to Mega.nz');
});


export function uploadFile(localFilePath, remoteFileName) {
  const fileStream = fs.createReadStream(localFilePath);

  const upload = storage.upload({
    name: remoteFileName,
    size: fs.statSync(localFilePath).size
  });

  fileStream.pipe(upload);

  upload.on('complete', function() {
    console.log(`File "${remoteFileName}" uploaded to Mega.nz`);
  });

  upload.on('error', function(err) {
    console.error(`Upload failed: ${err}`);
  });
}

export function downloadFile(remoteFileName, localFilePath) {
  storage.files[remoteFileName].download().pipe(fs.createWriteStream(localFilePath))
    .on('finish', () => {
      console.log(`File "${remoteFileName}" downloaded to ${localFilePath}`);
    })
    .on('error', err => {
      console.error(`Download failed: ${err}`);
    });
}
