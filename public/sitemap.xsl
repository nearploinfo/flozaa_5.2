<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9">
<xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
<xsl:template match="/">
<html>
<head>
<title>XML Sitemap</title>
<style>
body { font-family: sans-serif; margin: 2rem; color: #1a1a1a; }
table { width: 100%; border-collapse: collapse; }
th, td { text-align: left; padding: 0.5rem 0.75rem; border-bottom: 1px solid #ededed; font-size: 0.875rem; }
th { background: #f7f7f7; }
a { color: #0079ff; text-decoration: none; }
a:hover { text-decoration: underline; }
</style>
</head>
<body>
<h1>XML Sitemap</h1>
<table>
<tr><th>URL</th><th>Priority</th><th>Change Frequency</th><th>Last Modified</th></tr>
<xsl:for-each select="sitemap:urlset/sitemap:url">
<tr>
<td><a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a></td>
<td><xsl:value-of select="sitemap:priority"/></td>
<td><xsl:value-of select="sitemap:changefreq"/></td>
<td><xsl:value-of select="sitemap:lastmod"/></td>
</tr>
</xsl:for-each>
</table>
</body>
</html>
</xsl:template>
</xsl:stylesheet>
