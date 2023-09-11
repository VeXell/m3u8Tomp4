const path = require('path');
const fs = require('fs');
const { mkdir, access, unlink } = require('fs/promises');
const { execFile } = require('child_process');

const DOWNLOAD_DIR = 'converted';
const FFMPEG_PATH = path.join(process.cwd(), 'exec', 'ffmpeg');

const createDir = async (dirPath) => {
    try {
        await access(dirPath, fs.constants.F_OK | fs.constants.W_OK);
    } catch (error) {
        await mkdir(dirPath, {
            recursive: true,
        });
    }
};

const processFile = async (file, outfile) => {
    console.log(`Processing file ${file} to ${outfile}`);

    return new Promise((resolve, reject) => {
        execFile(
            FFMPEG_PATH,
            [
                '-y',
                '-protocol_whitelist',
                'file,http,https,tcp,tls,crypto',
                '-i',
                file,
                '-bsf:a',
                'aac_adtstoasc',
                '-vcodec',
                'copy',
                '-c',
                'copy',
                '-crf',
                '50',
                outfile,
            ],
            (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }

                console.log(stdout);
                console.log(stderr);
                resolve(true);
            }
        );
    });
};

const main = async () => {
    const currentDir = process.cwd();
    const downloadDir = path.join(currentDir, DOWNLOAD_DIR);
    await createDir(downloadDir);

    const dirCont = fs.readdirSync(currentDir);
    const files = dirCont.filter((elm) => elm.match(/.*\.(m3u8|m3u?)/gi));

    console.log(`Found ${files.length} files`);

    if (files.length) {
        // Start processing

        for (let i in files) {
            const file = files[i];
            const basename = path.basename(file);
            const filename = path.parse(basename).name;
            let ext='mp4';

            if (filename.indexOf('-a1') !== -1) {
                ext = 'aac';
            }

            const savePath = path.join(downloadDir, `${filename}.${ext}`);

            await processFile(file, savePath);

            // Remove prcoessed file
            await unlink(file);
        }
    }
};

main().then(() => {
    console.log('All done');
});
