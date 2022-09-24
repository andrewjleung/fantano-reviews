import fs from 'fs';

export default function get<T>(
  path: fs.PathOrFileDescriptor,
  compute: () => T,
) {
  fs.readFile(path, 'utf-8', (err, data) => {
    if (err) {
      const result = compute();
      fs.writeFileSync(path, JSON.stringify(result), { encoding: 'utf-8' });
      return;
    }

    return JSON.parse(data);
  });
}
