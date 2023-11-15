if message objects are changed and server code is updated to extract a new field name we are in trouble,  we need to force a browser refresh to get a get copy of web page

2023/11/14 for example I changed msg.word to msg.words on both client and server, package on render.com was updated and server restarted, non refreshed client was sending msg.word, server was looking for msg.words and crashed
