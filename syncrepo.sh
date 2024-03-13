


#!/bin/sh

# git config --global user.email "glotigorgeous@gmail.com"
# git config --global user.name "Ri-chard-Wu"

# cd /root/fnlPrj/annoy

git add *
git add -u
git commit -m "${1}"
git push -u origin master --force




# git add *
# git commit -m "${1}"
# git push -u origin master