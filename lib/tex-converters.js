'use strict'


var styleFiltersBlock = [
	{
		filter: /padding-left:\s*([0-9]+)\s*em\s*;?/i,
		replacement: function(all, num) { return Array(parseInt(num)+1).join('('); }
	},
	{
		filter: /padding-right:\s*([0-9]+)\s*em\s*;?/i,
		replacement: function(all, num) { return Array(parseInt(num)+1).join(')'); }
	},
	{
		filter: /text-align:\s*left\s*;?\s*;?/i,
		replacement: function() { return '<'; }
	},
	{
		filter: /text-align:\s*right\s*;?/i,
		replacement: function() { return '>'; }
	},
	{
		filter: /text-align:\s*center\s*;?/i,
		replacement: function() { return '='; }
	},
	{
		filter: /text-align:\s*justify\s*;?/i,
		replacement: function() { return '<>'; }
	},
];
var styleFiltersImg = [
	{
		filter: /\Walign:\s*left\s*;?\s*;?/i,
		replacement: function() { return '<'; }
	},
	{
		filter: /\Walign:\s*right\s*;?/i,
		replacement: function() { return '>'; }
	},
	{
		filter: /\Walign:\s*center\s*;?/i,
		replacement: function() { return '='; }
	},
];

function _makeClassId(node) {
	// apply any classes
	if (node.className.length>0 || node.id) {
		var id = '';
		if (node.className.length>0)
			id = node.className; //be indifferent to contents of className
		if (node.id)
			id += '#' + node.id;
		return '('+id+')';
	}
	return '';
}

function _colorRgbToHex(style) {
  return style
    .replace(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/g, function(s, r, g, b) {
      return '#' + [r, g, b].map(function(x) {
        return ('0' + parseInt(x).toString(16)).slice(-2);
      }).join('');
    });
}

function _styles(styles) {
  // Defined in redcloth3.rb
  var STYLES_RE = /^(color|width|height|border|background|padding|margin|font|float)(-[a-z]+)*:\s*((\d+%?|\d+px|\d+(\.\d+)?em|#[0-9a-f]+|[a-z]+|rgb\(\d+,\s*\d+,\s*\d+\))\s*)+$/i;

  var decl = styles.split(/\s*;\s*/)
      .filter(function(value) { return STYLES_RE.test(value) });

  if (decl.length === 0) return '';

  var val = decl.map(function(d) {
    return _colorRgbToHex(d) + ';';
  }).sort().join(' ');

  return '{' + val + '}';
}

function _attr(node, filters) {
	var strings = [];
	if (node.style.length) {
		var styles = node.style.cssText;
		
		if (filters)
		for (var i=0; i<filters.length && styles.length>0; i++) {
			var f = filters[i];
			var m = styles.match(f.filter);
			if (m) { // matched the filter
				strings.push(f.replacement.apply(f, m)); // convert
				styles = styles.replace(f.filter, '').trim(); // remove from source string
			}
		}

		// apply the remaining styles
		if (styles.length)
			strings.push(_styles(styles));
	}
	return strings.join('') + _makeClassId(node);
}

function attr(node) {
	return _attr(node, null)
}
function attrBlock(node) {
	// TODO. Add Lang='xx' support
	return _attr(node, styleFiltersBlock)
}

function attrImg(node) { // like above, but for images
	return _attr(node, styleFiltersImg)
}



module.exports = [
	{
		filter: 'p',
		replacement: function(content, node, options) {
			var a = options.attributeBlocks ? attrBlock(node) : '';
			if (a.length)
				return '\n\np' + a + '. ' + content + '\n\n'
			else
				return '\n\n' + content + '\n\n'

		}
	},

	{
		filter: 'br',
		replacement: function() {
			return '  \n'
		}
	},

	{
		filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
		replacement: function(content, node, options) {
			var h = node.nodeName.toLowerCase() + (options.attributeBlocks ? attrBlock(node) : '');
			return '\n\n' + h + '. ' + content + '\n\n'
		}
	},

	/*{
		filter: 'hr',
		replacement: function() {
			return '\n\n* * *\n\n'
		}
	},*/

	{
		filter: ['em', 'i'],
		replacement: function(content, node, options) {
			return '_' + (options.attributeBlocks ? attr(node) : '') + content + '_'
		}
	},

	{
		filter: ['strong', 'b'],
		replacement: function(content, node, options) {
			return '**' + (options.attributeBlocks ? attr(node) : '') + content + '**'
		}
	},
	{
		filter: ['span'],
		replacement: function(content, node, options) {
			var a = options.attributeBlocks ? attr(node) : '';
			if (a=='(caps)')
				// undo textile automatically wrapping [A-Z]{3,} in a <span class="caps">...</span>
				return content;
			return '%' + attr(node) + content + '%'
		}
	},
	{
		filter: ['cite'],
		replacement: function(content, node, options) {
			return '??' + (options.attributeBlocks ? attr(node) : '') + content + '??'
		}
	},
	{
		filter: ['del'],
		replacement: function(content, node, options) {
			return '-' + (options.attributeBlocks ? attr(node) : '') + content + '-'
		}
	},
	{
		filter: ['ins'],
		replacement: function(content, node, options) {
			return '+' + (options.attributeBlocks ? attr(node) : '') + content + '+'
		}
	},
	{
		filter: ['sup'],
		replacement: function(content, node, options) {
			return '^' + (options.attributeBlocks ? attr(node) : '') + content + '^'
		}
	},
	{
		filter: ['sub'],
		replacement: function(content, node, options) {
			return '~' + (options.attributeBlocks ? attr(node) : '') + content + '~'
		}
	},

	// Inline code
	{
		filter: function(node) {
			var hasSiblings = node.previousSibling || node.nextSibling
			var isCodeBlock = node.parentNode.nodeName === 'PRE' && !hasSiblings

			return node.nodeName === 'CODE' && !isCodeBlock
		},
		replacement: function(content, node, options) {
			return '@' + (options.attributeBlocks ? attr(node) : '') + content + '@'
		}
	},

	{
		filter: function(node) {
			return node.nodeName === 'A' && node.getAttribute('href')
		},
		replacement: function(content, node, options) {
			var titlePart = node.title ? ' (' + node.title + ')' : '';
			// CM TODO image links: !openwindow1.gif!:http://hobix.com/
			return '\"' + content +  titlePart + '\":' + node.getAttribute('href')
		}
	},

	{
		filter: 'img',
		replacement: function(content, node, options) {
			var alt = node.alt || ''
			var src = node.getAttribute('src') || '';
			var title = node.title || alt;
			var titlePart = title.length ? '(' + title + ')' : '';
			return src ? '!' + (options.attributeBlocks ? attrImg(node) : '') + src + titlePart + '!' : ''
		}
	},

	// Code blocks
	{
		filter: function(node) {
			return node.nodeName === 'PRE' && node.firstChild.nodeName === 'CODE'
		},
		replacement: function(content, node, options) {
			return '\n\nbc' + (options.attributeBlocks ? attrBlock(node) : '') + '. ' + node.firstChild.textContent + '\n\n'; 
		}
	},

	{
		filter: 'blockquote',
		replacement: function(content, node, options) {
			content = content.trim()
			content = content.replace(/\n{3,}/g, '\n\n')
			return '\n\nbq' + (options.attributeBlocks ? attrBlock(node) : '') + '. ' + content + '\n\n'
		}
	},

	{
		filter: 'li',
		replacement: function(content, node, options) {
			var prefix = /ul/i.test(node.parentNode.nodeName) ? '* ': '# ';
			return prefix + content;
		}
	},

	{
		filter: ['ul', 'ol'],
		replacement: function(content, node, options) {
			var strings = [];
			var a = options.attributeBlocks ? attr(node) : '';
			
			for (var i = 0; i < node.childNodes.length; i++) {
				if (i==0 && a.length) // first LI gets this Lists's attributes
					strings.push(node.childNodes[i]._replacement.replace(/ /, a+' '))
				else
					strings.push(node.childNodes[i]._replacement)
			}
			var hasParent = false;
			while (/li/i.test(node.parentNode.nodeName)) {
				hasParent = true;
				node = node.parentNode.parentNode; // go up to the UL/OL
				var prefix = /ul/i.test(node.nodeName) ? '*': '#';
				for (var i=0; i<strings.length; i++)
					strings[i] = prefix + strings[i];
			}
			if(hasParent)
				return '\n' + strings.join('\n')
			else
				return '\n\n' + strings.join('\n') + '\n\n'

		}
	},

	{
		filter: function(node) {
			return this.isBlock(node)
		},
		replacement: function(content, node) {
			return '\n\n' + this.outer(node, content) + '\n\n'
		}
	},

	// Anything else!
	{
		filter: function() {
			return true
		},
		replacement: function(content, node) {
			return this.outer(node, content)
		}
	}
]
