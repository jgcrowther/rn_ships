import scrapy

class ShipsSpider(scrapy.Spider):
    name = "ships"
    start_urls = [
        'https://en.wikipedia.org/wiki/List_of_ship_names_of_the_Royal_Navy'
    ]

    def parse(self, response):
        # Grabs data from individual ship pages
        for info in response.css('table.infobox'):

            # Finds the infobox section specific to the RN
            if info.xpath('//span[re:match(text(), "(?i)UK|United.Kingdom|Great.Britain")]//..//..//following-sibling::tr[following-sibling::tr/th]'):
                rn_section = info.xpath('//span[re:match(text(), "(?i)UK|United.Kingdom|Great.Britain")]//..//..//following-sibling::tr[following-sibling::tr/th]')
            elif info.xpath('//span/*[re:match(text(), "(?i)UK|United.Kingdom|Great.Britain")]//..//..//..//following-sibling::tr[following-sibling::tr/th]'):
                rn_section = info.xpath('//span/*[re:match(text(), "(?i)UK|United.Kingdom|Great.Britain")]//..//..//..//following-sibling::tr[following-sibling::tr/th]')
            else:
                rn_section = info.xpath('//tr//th//img[re:match(@src, "(?i)United.Kingdom|Royal.Navy")]//ancestor::tr//following-sibling::tr[following-sibling::tr//th]')

            # Gets name of Royal Navy name of ship
            if rn_section.xpath('td[re:match(text(), "(?i)Name")]'):
                name = rn_section.xpath('td[re:match(text(), "(?i)Name")]//following-sibling::td').css('::text').extract()
            else:
                name = response.css('h1.firstHeading i::text').extract()

            name = "".join(name)

            if "HMS" not in name:
                name = "HMS " + name

            # Finds the launch or acquired dates
            if rn_section.xpath('td[re:match(text(), "(?i)Completed|Commissioned|Launched|Laid.Down|In.Service")]'):
                start_element = rn_section.xpath('td[re:match(text(), "(?i)Completed|Commissioned|Launched|Laid.Down|'
                                                 'In.Service")]//following-sibling::td').css('::text')
            elif rn_section.xpath('td[re:match(text(), "(?i)Acquired|Captured")]'):
                start_element = rn_section.xpath('td[re:match(text(), "(?i)Acquired|Captured")]//following-sibling::td'
                                                 ).css('::text')
            elif rn_section.xpath('//td[re:match(text(), "(?i)Captured")]'):
                start_element = rn_section.xpath('//td[re:match(text(), "(?i)Captured")]//following-sibling::td')\
                    .css('::text')
            else:
                start_element = info.xpath('//td[re:match(text(), "(?i)Acquired|Launched|Laid.Down|In.Service")]//following-sibling::td').css('::text')

            if start_element.re(r'(?i)\b\w+\s\d\d\d\d\b'):
                start = start_element.re(r'(?i)\b\w+\s\d\d\d\d\b')[0]
            elif start_element.re(r'\b\d\d\d\d\b'):
                start = start_element.re(r'\b\d\d\d\d\b')[0]
            else:
                start = start_element

            # Finds the sunk, decommissioned or lost date.
            if rn_section.xpath('td[re:match(text(), "(?i)Decommissioned|Fate|Captured")]//following-sibling::td'):
                end_element = rn_section.xpath('td[re:match(text(), "(?i)Decommissioned|Fate|Captured")]'
                                               '//following-sibling::td').css('::text')

                if end_element.re(r'(?i)\b\w+\s\d\d\d\d\b'):
                    end = end_element.re(r'(?i)\b\w+\s\d\d\d\d\b')[0]
                elif end_element.re(r'\b\d\d\d\d\b'):
                    end = end_element.re(r'\b\d\d\d\d\b')[0]
                else:
                    end = end_element

            else:
                end = "Unknown"

            # Ship sunk or decommissioned?
            if rn_section.xpath('td[re:match(text(), "(?i)Fate")]//following-sibling::td').re(r'(?i)wrecked|sunk|sank'):
                fate = "sunk"
            else:
                fate = "decommissioned"

            # Get length of ship
            length = info.xpath('//td[re:match(text(), "(?i)Length")]//following-sibling::td').re(r'\b\d+\.?\d*\sft\b')
            if len(length) > 0:
                length = length[0]

            # Get type of ship
            type_of = "".join(info.xpath('//td[re:match(text(), "(?i)Class|Type")]//following-sibling::td').css('::text').extract())

            yield {
                'name': name,
                'start': start,
                'end': end,
                'length': length,
                'type': type_of,
                'fate': fate,
            }

        # Grabs individual ship links from duplicate named ships
        for link in response.xpath('//div[@class = "mw-parser-output"]//ul//a[re:match(text(), "(?i)HMS")]'):
            next_page = link.css('a::attr(href)').extract_first()
            yield response.follow(next_page, callback=self.parse)

        # Follows links on "sorted" pages
        for link in response.css('div.div-col li').xpath('//div//li//a[re:match(@href, "HMS.+")]'):
            next_page = link.css('a::attr(href)').extract_first()
            yield response.follow(next_page, callback=self.parse)

        # Follows initial links to sorted pages
        for link in response.xpath('//a[re:match(text(), "List of ship names of the Royal Navy.*")]'):
            next_page = link.css("a::attr(href)").extract_first()
            yield response.follow(next_page, callback=self.parse)
