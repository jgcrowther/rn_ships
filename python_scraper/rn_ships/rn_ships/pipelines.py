# -*- coding: utf-8 -*-

# Define your item pipelines here
#
# Don't forget to add your pipeline to the ITEM_PIPELINES setting
# See: http://doc.scrapy.org/en/latest/topics/item-pipeline.html
from scrapy.exceptions import DropItem
import re
from random import randint


class ShipsPipeline(object):
    def process_item(self, item, spider):
        if len(item['name']) <= 4:
            raise DropItem("Missing name in %s" % item)
        elif not item['start']:
            raise DropItem("Missing name in %s" % item)

        if re.search('(?i)castle', item['name']):
            item['name'] = re.search('(?i)HMS \w+ Castle', item['name']).group(0)
        if len(re.findall('HMS', item['name'])) > 1:
            item['name'] = re.search('(HMS \w+)HMS', item['name']).group(1)
        if re.search('HMS [A-Z][a-z]+[A-Z]', item['name']):
            item['name'] = re.search('(HMS [A-Z][a-z]+)[A-Z]', item['name']).group(1)
        if re.search('$.*HMS \w+', item['name']):
            item['name'] = re.search('$.*(HMS \w+)', item['name']).group(1)


        start = re.search('\d+', item['start'])
        start = int(start.group(0))

        if item['end'] == "Unknown" and start < 1985:
            raise DropItem("Missing end date in %s" % item)
        elif item['end'] == "Unknown" and start >= 1985:
            item['fate'] = "In Service"

        if not item['length']:
            item['length'] = str(randint(150, 450))

        length = re.search('\d+\.?\d*', item['length'])
        length = round(float(length.group(0)), 2)

        item['length'] = length * 0.3048

        return item
