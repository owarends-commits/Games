#!/bin/bash
# copy the playground sources and the built page into the repo
SB=/tmp/claude-0/-home-user/e5900e36-00d6-5b4b-82f0-38a92cf30ee1/scratchpad/sb; D=/home/user/owarends-commits/games/crossed/tools/previews
for f in $SB/*.js $SB/*.py $SB/base_engine.html $SB/base_builder.html $SB/sync.sh; do b=$(basename $f); case $b in three.min.js|heads*|hv.js|gtest.js|npdbg.js|nwdbg.js) ;; esac; case $b in three.min.js|heads*|hv.js|gtest.js) continue;; *dbg*) [ $b = npdbg.js ] || [ $b = nwdbg.js ] || continue;; esac; cp $f $D/src/$b; done
cp $SB/crossed-sandbox.html $D/combat_playground.html
mkdir -p $D/m/bosses/hob && cp $SB/m/bosses/hob/* $D/m/bosses/hob/
