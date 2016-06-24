#!/usr/bin/env bash

if [ -z "${MANTA_KEY_CONTENT}" ]; then
  >&2 echo "MANTA_KEY_CONTENT must be set"
  exit 1
fi

if [ -z "${MANTA_KEY_ID}" ]; then
  >&2 echo "MANTA_KEY_ID must be set"
  exit 1
fi

if [ -z "${MANTA_URL}" ]; then
  >&2 echo "MANTA_URL must be set"
  exit 1
fi

if [ -z "${MANTA_USER}" ]; then
  >&2 echo "MANTA_USER must be set"
  exit 1
fi

if [ -z "${AWS_ACCESS_KEY_ID}" ]; then
  >&2 echo "AWS_ACCESS_KEY_ID must be set"
  exit 1
fi

if [ -z "${AWS_SECRET_ACCESS_KEY}" ]; then
  >&2 echo "AWS_SECRET_ACCESS_KEY must be set"
  exit 1
fi

echo "Copying private key to app home"
mkdir -p /home/app/.ssh
echo "${MANTA_KEY_CONTENT}" > /home/app/.ssh/id_rsa
