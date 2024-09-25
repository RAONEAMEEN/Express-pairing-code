import mega from 'megajs';
import fs from 'fs';

// Replace with your Mega.nz credentials
const email = 'your-email@domain.com';
const password = 'your-password';

// Mega login session
const storage = mega({
  email: email,
  password: password,
  keepalive: false
}, () => {
  console.log('Logged in to Mega.nz');
});

// Function to upload files to Mega
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

// Function to download files from Mega
export function downloadFile(remoteFileName, localFilePath) {
  storage.files[remoteFileName].download().pipe(fs.createWriteStream(localFilePath))
    .on('finish', () => {
      console.log(`File "${remoteFileName}" downloaded to ${localFilePath}`);
    })
    .on('error', err => {
      console.error(`Download failed: ${err}`);
    });
}
