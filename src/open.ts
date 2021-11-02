import { Rosbag2 } from "@foxglove/rosbag2";
import { readdir } from "fs/promises";
import path from "path";

import { FsReader } from "./FsReader";
import { SqliteNodejs } from "./SqliteNodejs";

export async function openNodejsFile(filename: string): Promise<Rosbag2> {
  const entries = [{ relativePath: path.basename(filename), file: new FsReader(filename) }];
  const bag = new Rosbag2(entries, (_) => new SqliteNodejs(filename));
  await bag.open();
  return bag;
}

export async function openNodejsDirectory(folder: string): Promise<Rosbag2> {
  const filenames = await listFiles(folder, ".");
  const entries = filenames.map((filename) => ({
    relativePath: filename,
    file: new FsReader(path.join(folder, filename)),
  }));
  const bag = new Rosbag2(
    entries,
    (fileEntry) => new SqliteNodejs(path.join(folder, fileEntry.relativePath)),
  );
  await bag.open();
  return bag;
}

async function listFiles(baseDir: string, dirname: string): Promise<string[]> {
  let filenames: string[] = [];
  const fullPath = path.join(baseDir, dirname);
  const entries = await readdir(fullPath, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(dirname, entry.name);
    if (entry.isFile()) {
      filenames.push(entryPath);
    } else if (entry.isDirectory()) {
      filenames = filenames.concat(await listFiles(baseDir, entryPath));
    }
  }
  return filenames;
}
