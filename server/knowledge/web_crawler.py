# web_crawler.py
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

class WebCrawler:
    def __init__(self, max_links=50):
        self.max_links = max_links

    @staticmethod
    def clean_text(soup):
        for script in soup(["script", "style"]):
            script.extract()
        text = soup.get_text()
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = '\n'.join(chunk for chunk in chunks if chunk)
        return text

    @staticmethod
    def get_domain(url):
        return urlparse(url).netloc

    def crawl(self, url, depth, visited=None, domain=None, crawled_count=None):
        if crawled_count is None:
            crawled_count = [0]
        if visited is None:
            visited = {}
        if domain is None:
            domain = self.get_domain(url)

        if depth < 0 or url in visited or crawled_count[0] >= self.max_links:
            return crawled_count[0]
        try:
            current_domain = self.get_domain(url)
            if current_domain != domain:
                return crawled_count[0]
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) '
                              'Chrome/84.0.4147.105 Safari/537.36'
            }
            response = requests.get(url, allow_redirects=True, headers=headers, timeout=5)
            soup = BeautifulSoup(response.text, 'html.parser')
            visited[url] = self.clean_text(soup)
            crawled_count[0] += 1

            for link in soup.find_all('a', href=True):
                print(link)
                if crawled_count[0] >= self.max_links:
                    break
                full_url = urljoin(url, link['href'])
                self.crawl(full_url, depth-1, visited, domain, crawled_count)
        except Exception as e:
            print(f"Failed to visit {url}: {e}")
        return crawled_count[0]
