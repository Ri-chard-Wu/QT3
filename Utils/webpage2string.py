



import re



f = open("..\Software\index.html", "r")
content = f.read()
f.close()


f = open("..\Firmware\esp32WifiWebpageServer\main\Communication\web_page_content.h.template", "r")
template = f.read()
f.close()



content = re.sub('\"', '\\\"', content)
content = re.sub("\n", '\\\n', content)

content = re.sub("(?<!:)\/\/.*\n", '', content) # replace comments but not 'http://'.
content = re.sub("(?<=[\'\"])\.\/", 'http://192.168.1.145:8080/', content) # replace './' with 'http://192.168.1.145:8080/'.
content = re.sub("esp32Deploy[ =]*false", 'esp32Deploy = true', content)

# print(content)

template = re.sub("<PAGE_CONTENT>", content, template)

f = open("..\Firmware\esp32WifiWebpageServer\main\Communication\web_page_content.h", "w")
f.write(template)
f.close()

# print(template)

