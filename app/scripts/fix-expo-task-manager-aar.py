#!/usr/bin/env python3
"""Fix expo-task-manager 14.x prebuilt AAR: the published classes.jar stores
BuildConfig.class under expo/modules/taskManager/ (capital M) while the class
itself declares package expo.modules.taskmanager. R8 rejects the mismatch when
minifying the androidTest variant. Repack the jar with the correct path."""

import shutil
import sys
import tempfile
import zipfile
from pathlib import Path

BAD = "expo/modules/taskManager/BuildConfig.class"
GOOD = "expo/modules/taskmanager/BuildConfig.class"

root = Path(__file__).resolve().parent.parent
aars = list(
    (root / "node_modules/expo-task-manager/local-maven-repo").glob("**/*.aar")
)

if not aars:
    print("fix-expo-task-manager-aar: no AAR found, nothing to do")
    sys.exit(0)

for aar_path in aars:
    with zipfile.ZipFile(aar_path) as aar:
        names = aar.namelist()
        if "classes.jar" not in names:
            continue
        with tempfile.TemporaryDirectory() as tmp:
            tmp = Path(tmp)
            aar.extractall(tmp)

            classes = tmp / "classes.jar"
            with zipfile.ZipFile(classes) as jar:
                jar_names = jar.namelist()
                if BAD not in jar_names:
                    print(f"fix-expo-task-manager-aar: {aar_path.name} already clean")
                    continue
                jar.extractall(tmp / "jar")

            bad_file = tmp / "jar" / BAD
            good_file = tmp / "jar" / GOOD
            good_file.parent.mkdir(parents=True, exist_ok=True)
            bad_file.rename(good_file)
            # Drop the now-empty wrong-case directory
            try:
                bad_file.parent.rmdir()
            except OSError:
                pass

            with zipfile.ZipFile(classes, "w", zipfile.ZIP_DEFLATED) as jar:
                for f in sorted((tmp / "jar").rglob("*")):
                    if f.is_file():
                        jar.write(f, f.relative_to(tmp / "jar"))

            new_aar = tmp / "new.aar"
            with zipfile.ZipFile(new_aar, "w", zipfile.ZIP_DEFLATED) as aar_out:
                for f in sorted(tmp.rglob("*")):
                    if f.is_file() and f not in (new_aar,) and (tmp / "jar") not in f.parents and f != new_aar:
                        aar_out.write(f, f.relative_to(tmp))

            shutil.copyfile(new_aar, aar_path)
            print(f"fix-expo-task-manager-aar: fixed {aar_path}")
