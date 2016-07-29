(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * AnchorJS - v3.2.1 - 2016-07-18
 * https://github.com/bryanbraun/anchorjs
 * Copyright (c) 2016 Bryan Braun; Licensed MIT
 */

/* eslint-env amd, node */

// https://github.com/umdjs/umd/blob/master/templates/returnExports.js
(function (root, factory) {
  'use strict';

  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory();
  } else {
    // Browser globals (root is window)
    root.AnchorJS = factory();
    root.anchors = new root.AnchorJS();
  }
}(this, function () {
  'use strict';

  function AnchorJS(options) {
    this.options = options || {};
    this.elements = [];

    /**
     * Assigns options to the internal options object, and provides defaults.
     * @param {Object} opts - Options object
     */
    function _applyRemainingDefaultOptions(opts) {
      opts.icon = opts.hasOwnProperty('icon') ? opts.icon : '\ue9cb'; // Accepts characters (and also URLs?), like  '#', '¶', '❡', or '§'.
      opts.visible = opts.hasOwnProperty('visible') ? opts.visible : 'hover'; // Also accepts 'always' & 'touch'
      opts.placement = opts.hasOwnProperty('placement') ? opts.placement : 'right'; // Also accepts 'left'
      opts.class = opts.hasOwnProperty('class') ? opts.class : ''; // Accepts any class name.
      // Using Math.floor here will ensure the value is Number-cast and an integer.
      opts.truncate = opts.hasOwnProperty('truncate') ? Math.floor(opts.truncate) : 64; // Accepts any value that can be typecast to a number.
    }

    _applyRemainingDefaultOptions(this.options);

    /**
     * Checks to see if this device supports touch. Uses criteria pulled from Modernizr:
     * https://github.com/Modernizr/Modernizr/blob/da22eb27631fc4957f67607fe6042e85c0a84656/feature-detects/touchevents.js#L40
     * @return {Boolean} - true if the current device supports touch.
     */
    this.isTouchDevice = function() {
      return !!(('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch);
    };

    /**
     * Add anchor links to page elements.
     * @param  {String|Array|Nodelist} selector - A CSS selector for targeting the elements you wish to add anchor links
     *                                            to. Also accepts an array or nodeList containing the relavant elements.
     * @return {this}                           - The AnchorJS object
     */
    this.add = function(selector) {
      var elements,
          elsWithIds,
          idList,
          elementID,
          i,
          index,
          count,
          tidyText,
          newTidyText,
          readableID,
          anchor,
          visibleOptionToUse,
          indexesToDrop = [];

      // We reapply options here because somebody may have overwritten the default options object when setting options.
      // For example, this overwrites all options but visible:
      //
      // anchors.options = { visible: 'always'; }
      _applyRemainingDefaultOptions(this.options);

      visibleOptionToUse = this.options.visible;
      if (visibleOptionToUse === 'touch') {
        visibleOptionToUse = this.isTouchDevice() ? 'always' : 'hover';
      }

      // Provide a sensible default selector, if none is given.
      if (!selector) {
        selector = 'h1, h2, h3, h4, h5, h6';
      }

      elements = _getElements(selector);

      if (elements.length === 0) {
        return false;
      }

      _addBaselineStyles();

      // We produce a list of existing IDs so we don't generate a duplicate.
      elsWithIds = document.querySelectorAll('[id]');
      idList = [].map.call(elsWithIds, function assign(el) {
        return el.id;
      });

      for (i = 0; i < elements.length; i++) {
        if (this.hasAnchorJSLink(elements[i])) {
          indexesToDrop.push(i);
          continue;
        }

        if (elements[i].hasAttribute('id')) {
          elementID = elements[i].getAttribute('id');
        } else {
          tidyText = this.urlify(elements[i].textContent);

          // Compare our generated ID to existing IDs (and increment it if needed)
          // before we add it to the page.
          newTidyText = tidyText;
          count = 0;
          do {
            if (index !== undefined) {
              newTidyText = tidyText + '-' + count;
            }

            index = idList.indexOf(newTidyText);
            count += 1;
          } while (index !== -1);
          index = undefined;
          idList.push(newTidyText);

          elements[i].setAttribute('id', newTidyText);
          elementID = newTidyText;
        }

        readableID = elementID.replace(/-/g, ' ');

        // The following code builds the following DOM structure in a more effiecient (albeit opaque) way.
        // '<a class="anchorjs-link ' + this.options.class + '" href="#' + elementID + '" aria-label="Anchor link for: ' + readableID + '" data-anchorjs-icon="' + this.options.icon + '"></a>';
        anchor = document.createElement('a');
        anchor.className = 'anchorjs-link ' + this.options.class;
        anchor.href = '#' + elementID;
        anchor.setAttribute('aria-label', 'Anchor link for: ' + readableID);
        anchor.setAttribute('data-anchorjs-icon', this.options.icon);

        if (visibleOptionToUse === 'always') {
          anchor.style.opacity = '1';
        }

        if (this.options.icon === '\ue9cb') {
          anchor.style.fontFamily = 'anchorjs-icons';
          anchor.style.fontStyle = 'normal';
          anchor.style.fontVariant = 'normal';
          anchor.style.fontWeight = 'normal';
          anchor.style.lineHeight = 1;

          // We set lineHeight = 1 here because the `anchorjs-icons` font family could otherwise affect the
          // height of the heading. This isn't the case for icons with `placement: left`, so we restore
          // line-height: inherit in that case, ensuring they remain positioned correctly. For more info,
          // see https://github.com/bryanbraun/anchorjs/issues/39.
          if (this.options.placement === 'left') {
            anchor.style.lineHeight = 'inherit';
          }
        }

        if (this.options.placement === 'left') {
          anchor.style.position = 'absolute';
          anchor.style.marginLeft = '-1em';
          anchor.style.paddingRight = '0.5em';
          elements[i].insertBefore(anchor, elements[i].firstChild);
        } else { // if the option provided is `right` (or anything else).
          anchor.style.paddingLeft = '0.375em';
          elements[i].appendChild(anchor);
        }
      }

      for (i = 0; i < indexesToDrop.length; i++) {
        elements.splice(indexesToDrop[i] - i, 1);
      }
      this.elements = this.elements.concat(elements);

      return this;
    };

    /**
     * Removes all anchorjs-links from elements targed by the selector.
     * @param  {String|Array|Nodelist} selector - A CSS selector string targeting elements with anchor links,
     *                                       	  	OR a nodeList / array containing the DOM elements.
     * @return {this}                           - The AnchorJS object
     */
    this.remove = function(selector) {
      var index,
          domAnchor,
          elements = _getElements(selector);

      for (var i = 0; i < elements.length; i++) {
        domAnchor = elements[i].querySelector('.anchorjs-link');
        if (domAnchor) {
          // Drop the element from our main list, if it's in there.
          index = this.elements.indexOf(elements[i]);
          if (index !== -1) {
            this.elements.splice(index, 1);
          }
          // Remove the anchor from the DOM.
          elements[i].removeChild(domAnchor);
        }
      }
      return this;
    };

    /**
     * Removes all anchorjs links. Mostly used for tests.
     */
    this.removeAll = function() {
      this.remove(this.elements);
    };

    /**
     * Urlify - Refine text so it makes a good ID.
     *
     * To do this, we remove apostrophes, replace nonsafe characters with hyphens,
     * remove extra hyphens, truncate, trim hyphens, and make lowercase.
     *
     * @param  {String} text - Any text. Usually pulled from the webpage element we are linking to.
     * @return {String}      - hyphen-delimited text for use in IDs and URLs.
     */
    this.urlify = function(text) {
      // Regex for finding the nonsafe URL characters (many need escaping): & +$,:;=?@"#{}|^~[`%!']./()*\
      var nonsafeChars = /[& +$,:;=?@"#{}|^~[`%!'\]\.\/\(\)\*\\]/g,
          urlText;

      // The reason we include this _applyRemainingDefaultOptions is so urlify can be called independently,
      // even after setting options. This can be useful for tests or other applications.
      if (!this.options.truncate) {
        _applyRemainingDefaultOptions(this.options);
      }

      // Note: we trim hyphens after truncating because truncating can cause dangling hyphens.
      // Example string:                                  // " ⚡⚡ Don't forget: URL fragments should be i18n-friendly, hyphenated, short, and clean."
      urlText = text.trim()                               // "⚡⚡ Don't forget: URL fragments should be i18n-friendly, hyphenated, short, and clean."
                    .replace(/\'/gi, '')                  // "⚡⚡ Dont forget: URL fragments should be i18n-friendly, hyphenated, short, and clean."
                    .replace(nonsafeChars, '-')           // "⚡⚡-Dont-forget--URL-fragments-should-be-i18n-friendly--hyphenated--short--and-clean-"
                    .replace(/-{2,}/g, '-')               // "⚡⚡-Dont-forget-URL-fragments-should-be-i18n-friendly-hyphenated-short-and-clean-"
                    .substring(0, this.options.truncate)  // "⚡⚡-Dont-forget-URL-fragments-should-be-i18n-friendly-hyphenated-"
                    .replace(/^-+|-+$/gm, '')             // "⚡⚡-Dont-forget-URL-fragments-should-be-i18n-friendly-hyphenated"
                    .toLowerCase();                       // "⚡⚡-dont-forget-url-fragments-should-be-i18n-friendly-hyphenated"

      return urlText;
    };

    /**
     * Determines if this element already has an AnchorJS link on it.
     * Uses this technique: http://stackoverflow.com/a/5898748/1154642
     * @param    {HTMLElemnt}  el - a DOM node
     * @return   {Boolean}     true/false
     */
    this.hasAnchorJSLink = function(el) {
      var hasLeftAnchor = el.firstChild && ((' ' + el.firstChild.className + ' ').indexOf(' anchorjs-link ') > -1),
          hasRightAnchor = el.lastChild && ((' ' + el.lastChild.className + ' ').indexOf(' anchorjs-link ') > -1);

      return hasLeftAnchor || hasRightAnchor || false;
    };

    /**
     * Turns a selector, nodeList, or array of elements into an array of elements (so we can use array methods).
     * It also throws errors on any other inputs. Used to handle inputs to .add and .remove.
     * @param  {String|Array|Nodelist} input - A CSS selector string targeting elements with anchor links,
     *                                       	 OR a nodeList / array containing the DOM elements.
     * @return {Array} - An array containing the elements we want.
     */
    function _getElements(input) {
      var elements;
      if (typeof input === 'string' || input instanceof String) {
        // See https://davidwalsh.name/nodelist-array for the technique transforming nodeList -> Array.
        elements = [].slice.call(document.querySelectorAll(input));
      // I checked the 'input instanceof NodeList' test in IE9 and modern browsers and it worked for me.
      } else if (Array.isArray(input) || input instanceof NodeList) {
        elements = [].slice.call(input);
      } else {
        throw new Error('The selector provided to AnchorJS was invalid.');
      }
      return elements;
    }

    /**
     * _addBaselineStyles
     * Adds baseline styles to the page, used by all AnchorJS links irregardless of configuration.
     */
    function _addBaselineStyles() {
      // We don't want to add global baseline styles if they've been added before.
      if (document.head.querySelector('style.anchorjs') !== null) {
        return;
      }

      var style = document.createElement('style'),
          linkRule =
          ' .anchorjs-link {'                       +
          '   opacity: 0;'                          +
          '   text-decoration: none;'               +
          '   -webkit-font-smoothing: antialiased;' +
          '   -moz-osx-font-smoothing: grayscale;'  +
          ' }',
          hoverRule =
          ' *:hover > .anchorjs-link,'              +
          ' .anchorjs-link:focus  {'                +
          '   opacity: 1;'                          +
          ' }',
          anchorjsLinkFontFace =
          ' @font-face {'                           +
          '   font-family: "anchorjs-icons";'       +
          '   font-style: normal;'                  +
          '   font-weight: normal;'                 + // Icon from icomoon; 10px wide & 10px tall; 2 empty below & 4 above
          '   src: url(data:application/x-font-ttf;charset=utf-8;base64,AAEAAAALAIAAAwAwT1MvMg8SBTUAAAC8AAAAYGNtYXAWi9QdAAABHAAAAFRnYXNwAAAAEAAAAXAAAAAIZ2x5Zgq29TcAAAF4AAABNGhlYWQEZM3pAAACrAAAADZoaGVhBhUDxgAAAuQAAAAkaG10eASAADEAAAMIAAAAFGxvY2EAKACuAAADHAAAAAxtYXhwAAgAVwAAAygAAAAgbmFtZQ5yJ3cAAANIAAAB2nBvc3QAAwAAAAAFJAAAACAAAwJAAZAABQAAApkCzAAAAI8CmQLMAAAB6wAzAQkAAAAAAAAAAAAAAAAAAAABEAAAAAAAAAAAAAAAAAAAAABAAADpywPA/8AAQAPAAEAAAAABAAAAAAAAAAAAAAAgAAAAAAADAAAAAwAAABwAAQADAAAAHAADAAEAAAAcAAQAOAAAAAoACAACAAIAAQAg6cv//f//AAAAAAAg6cv//f//AAH/4xY5AAMAAQAAAAAAAAAAAAAAAQAB//8ADwABAAAAAAAAAAAAAgAANzkBAAAAAAEAAAAAAAAAAAACAAA3OQEAAAAAAQAAAAAAAAAAAAIAADc5AQAAAAACADEARAJTAsAAKwBUAAABIiYnJjQ/AT4BMzIWFxYUDwEGIicmND8BNjQnLgEjIgYPAQYUFxYUBw4BIwciJicmND8BNjIXFhQPAQYUFx4BMzI2PwE2NCcmNDc2MhcWFA8BDgEjARQGDAUtLXoWOR8fORYtLTgKGwoKCjgaGg0gEhIgDXoaGgkJBQwHdR85Fi0tOAobCgoKOBoaDSASEiANehoaCQkKGwotLXoWOR8BMwUFLYEuehYXFxYugC44CQkKGwo4GkoaDQ0NDXoaShoKGwoFBe8XFi6ALjgJCQobCjgaShoNDQ0NehpKGgobCgoKLYEuehYXAAEAAAABAACiToc1Xw889QALBAAAAAAA0XnFFgAAAADRecUWAAAAAAJTAsAAAAAIAAIAAAAAAAAAAQAAA8D/wAAABAAAAAAAAlMAAQAAAAAAAAAAAAAAAAAAAAUAAAAAAAAAAAAAAAACAAAAAoAAMQAAAAAACgAUAB4AmgABAAAABQBVAAIAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAADgCuAAEAAAAAAAEADgAAAAEAAAAAAAIABwCfAAEAAAAAAAMADgBLAAEAAAAAAAQADgC0AAEAAAAAAAUACwAqAAEAAAAAAAYADgB1AAEAAAAAAAoAGgDeAAMAAQQJAAEAHAAOAAMAAQQJAAIADgCmAAMAAQQJAAMAHABZAAMAAQQJAAQAHADCAAMAAQQJAAUAFgA1AAMAAQQJAAYAHACDAAMAAQQJAAoANAD4YW5jaG9yanMtaWNvbnMAYQBuAGMAaABvAHIAagBzAC0AaQBjAG8AbgBzVmVyc2lvbiAxLjAAVgBlAHIAcwBpAG8AbgAgADEALgAwYW5jaG9yanMtaWNvbnMAYQBuAGMAaABvAHIAagBzAC0AaQBjAG8AbgBzYW5jaG9yanMtaWNvbnMAYQBuAGMAaABvAHIAagBzAC0AaQBjAG8AbgBzUmVndWxhcgBSAGUAZwB1AGwAYQByYW5jaG9yanMtaWNvbnMAYQBuAGMAaABvAHIAagBzAC0AaQBjAG8AbgBzRm9udCBnZW5lcmF0ZWQgYnkgSWNvTW9vbi4ARgBvAG4AdAAgAGcAZQBuAGUAcgBhAHQAZQBkACAAYgB5ACAASQBjAG8ATQBvAG8AbgAuAAAAAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==) format("truetype");' +
          ' }',
          pseudoElContent =
          ' [data-anchorjs-icon]::after {'          +
          '   content: attr(data-anchorjs-icon);'   +
          ' }',
          firstStyleEl;

      style.className = 'anchorjs';
      style.appendChild(document.createTextNode('')); // Necessary for Webkit.

      // We place it in the head with the other style tags, if possible, so as to
      // not look out of place. We insert before the others so these styles can be
      // overridden if necessary.
      firstStyleEl = document.head.querySelector('[rel="stylesheet"], style');
      if (firstStyleEl === undefined) {
        document.head.appendChild(style);
      } else {
        document.head.insertBefore(style, firstStyleEl);
      }

      style.sheet.insertRule(linkRule, style.sheet.cssRules.length);
      style.sheet.insertRule(hoverRule, style.sheet.cssRules.length);
      style.sheet.insertRule(pseudoElContent, style.sheet.cssRules.length);
      style.sheet.insertRule(anchorjsLinkFontFace, style.sheet.cssRules.length);
    }
  }

  return AnchorJS;
}));

},{}],2:[function(require,module,exports){
// Native Javascript for Bootstrap 3 | Collapse
// by dnp_theme

(function(factory){

  // CommonJS/RequireJS and "native" compatibility
  if(typeof module !== "undefined" && typeof exports == "object") {
    // A commonJS/RequireJS environment
    if(typeof window != "undefined") {
      // Window and document exist, so return the factory's return value.
      module.exports = factory();
    } else {
      // Let the user give the factory a Window and Document.
      module.exports = factory;
    }
  } else {
    // Assume a traditional browser.
    window.Collapse = factory();
  }

})(function(){

  // COLLAPSE DEFINITION
  // ===================
  var Collapse = function( element, options ) {
    options = options || {};
    this.isIE = (new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})").exec(navigator.userAgent) != null) ? parseFloat( RegExp.$1 ) : false;
    this.btn = typeof element === 'object' ? element : document.querySelector(element);
    this.accordion = null;
    this.collapse = null;
    this.duration = 300; // default collapse transition duration
    this.options = {};
    this.options.duration = (this.isIE && this.isIE < 10) ? 0 : (options.duration || this.duration);
    this.init();
  };

  // COLLAPSE METHODS
  // ================
  Collapse.prototype = {

    init : function() {
      this.actions();
      this.addEvent();
      this.collapse = this.getTarget();
      this.accordion = this.btn.getAttribute('data-parent') 
        && this.getClosest(this.btn, this.btn.getAttribute('data-parent'));
    },

    actions : function() {
      var self = this;
      var getOuterHeight = function (el) {
        var s = el && (el.currentStyle || window.getComputedStyle(el)), // the getComputedStyle polyfill would do this for us, but we want to make sure it does
          btp = /px/.test(s.borderTopWidth) ? Math.round(s.borderTopWidth.replace('px','')) : 0,
          mtp = /px/.test(s.marginTop)  ? Math.round(s.marginTop.replace('px',''))    : 0,
          mbp = /px/.test(s.marginBottom)  ? Math.round(s.marginBottom.replace('px',''))  : 0,
          mte = /em/.test(s.marginTop)  ? Math.round(s.marginTop.replace('em','')    * parseInt(s.fontSize)) : 0,
          mbe = /em/.test(s.marginBottom)  ? Math.round(s.marginBottom.replace('em','')  * parseInt(s.fontSize)) : 0;
        return el.clientHeight + parseInt( btp ) + parseInt( mtp ) + parseInt( mbp ) + parseInt( mte ) + parseInt( mbe ); //we need an accurate margin value
      };

      this.toggle = function(e) {
        e.preventDefault();

        if (!/\bin/.test(self.collapse.className)) {
          self.open();
        } else {
          self.close();
        }
      },
      this.close = function() {
        self._close(self.collapse);
        self.addClass(self.btn,'collapsed');
      },
      this.open = function() {
        self._open(self.collapse);
        self.removeClass(self.btn,'collapsed');

        if ( self.accordion !== null ) {
          var active = self.accordion.querySelectorAll('.collapse.in'), al = active.length, i = 0;
          for (i;i<al;i++) {
            if ( active[i] !== self.collapse) self._close(active[i]);
          }
        }
      },
      this._open = function(c) {
        self.removeEvent();
        self.addClass(c,'in');
        c.setAttribute('aria-expanded','true');
        self.addClass(c,'collapsing');
        setTimeout(function() {
          c.style.height = self.getMaxHeight(c) + 'px'
          c.style.overflowY = 'hidden';
        }, 0);  
        setTimeout(function() {
          c.style.height = ''; 
          c.style.overflowY = '';
          self.removeClass(c,'collapsing');
          self.addEvent();
        }, self.options.duration);
      },
      this._close = function(c) {
        self.removeEvent();
        c.setAttribute('aria-expanded','false');
        c.style.height = self.getMaxHeight(c) + 'px'
        setTimeout(function() {
          c.style.height = '0px';    
          c.style.overflowY = 'hidden';
          self.addClass(c,'collapsing');
        }, 0);
        
        setTimeout(function() {
          self.removeClass(c,'collapsing');
          self.removeClass(c,'in'); 
          c.style.overflowY = '';
          c.style.height = '';          
          self.addEvent();
        }, self.options.duration);
      },
      this.getMaxHeight = function(l) { // get collapse trueHeight and border
        var h = 0;
        for (var k = 0, ll = l.children.length; k < ll; k++) {
          h += getOuterHeight(l.children[k]);
        }
        return h;
      },
      this.removeEvent = function() {
        this.btn.removeEventListener('click', this.toggle, false);
      },
      this.addEvent = function() {
        this.btn.addEventListener('click', this.toggle, false);
      },
      this.getTarget = function() {
        var t = this.btn,
          h = t.href && t.getAttribute('href').replace('#',''),
          d = t.getAttribute('data-target') && ( t.getAttribute('data-target') ),
          id = h || ( d && /#/.test(d)) && d.replace('#',''),
          cl = (d && d.charAt(0) === '.') && d, //the navbar collapse trigger targets a class
          c = id && document.getElementById(id) || cl && document.querySelector(cl);
        return c;
      },

      this.getClosest = function (el, s) { //el is the element and s the selector of the closest item to find
      // source http://gomakethings.com/climbing-up-and-down-the-dom-tree-with-vanilla-javascript/
        var f = s.charAt(0);
        for ( ; el && el !== document; el = el.parentNode ) {// Get closest match
          if ( f === '.' ) {// If selector is a class
            if ( document.querySelector(s) !== undefined ) { return el; }
          }
          if ( f === '#' ) { // If selector is an ID
            if ( el.id === s.substr(1) ) { return el; }
          }
        }
        return false;
      };
      this.addClass = function(el,c) {  
        if (el.classList) { el.classList.add(c); } else { el.className += ' '+c; }
      };
      this.removeClass = function(el,c) {
        if (el.classList) { el.classList.remove(c); } else { el.className = el.className.replace(c,'').replace(/^\s+|\s+$/g,''); }
      };
    }
  };

  // COLLAPSE DATA API
  // =================
  var Collapses = document.querySelectorAll('[data-toggle="collapse"]'), i = 0, cll = Collapses.length;
  for (i;i<cll;i++) {
    var item = Collapses[i], options = {};
    options.duration = item.getAttribute('data-duration');
    new Collapse(item,options);
  }

  return Collapse;

});

},{}],3:[function(require,module,exports){
/*!
 * sweet-scroll
 * Modern and the sweet smooth scroll library.
 * @author tsuyoshiwada
 * @license MIT
 * @version 1.0.3
 */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.SweetScroll = factory());
}(this, function () { 'use strict';

  var cos = Math.cos;
  var sin = Math.sin;
  var pow = Math.pow;
  var abs = Math.abs;
  var sqrt = Math.sqrt;
  var asin = Math.asin;
  var PI = Math.PI;
  var max = Math.max;
  var min = Math.min;
  var round = Math.round;

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj;
  };

  var classCallCheck = function (instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  };

  var createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();

  var MAX_ARRAY_INDEX = pow(2, 53) - 1;
  var classTypeList = ["Boolean", "Number", "String", "Function", "Array", "Object"];
  var classTypes = {};

  classTypeList.forEach(function (name) {
    classTypes["[object " + name + "]"] = name.toLowerCase();
  });

  function getType(obj) {
    if (obj == null) {
      return "";
    }

    return (typeof obj === "undefined" ? "undefined" : _typeof(obj)) === "object" || typeof obj === "function" ? classTypes[Object.prototype.toString.call(obj)] || "object" : typeof obj === "undefined" ? "undefined" : _typeof(obj);
  }

  function isNumber(obj) {
    return getType(obj) === "number";
  }

  function isString(obj) {
    return getType(obj) === "string";
  }

  function isFunction(obj) {
    return getType(obj) === "function";
  }

  function isArray(obj) {
    return Array.isArray(obj);
  }

  function isArrayLike(obj) {
    var length = obj == null ? null : obj.length;

    return isNumber(length) && length >= 0 && length <= MAX_ARRAY_INDEX;
  }

  function isNumeric(obj) {
    return !isArray(obj) && obj - parseFloat(obj) + 1 >= 0;
  }

  function isObject(obj) {
    return !isArray(obj) && getType(obj) === "object";
  }

  function hasProp(obj, key) {
    return obj && obj.hasOwnProperty(key);
  }

  function each(obj, iterate, context) {
    if (obj == null) return obj;

    var ctx = context || obj;

    if (isObject(obj)) {
      for (var key in obj) {
        if (!hasProp(obj, key)) continue;
        if (iterate.call(ctx, obj[key], key) === false) break;
      }
    } else if (isArrayLike(obj)) {
      for (var i = 0; i < obj.length; i++) {
        if (iterate.call(ctx, obj[i], i) === false) break;
      }
    }

    return obj;
  }

  function merge(obj) {
    for (var _len = arguments.length, sources = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      sources[_key - 1] = arguments[_key];
    }

    each(sources, function (source) {
      each(source, function (value, key) {
        obj[key] = value;
      });
    });

    return obj;
  }

  function removeSpaces(str) {
    return str.replace(/\s*/g, "") || "";
  }

  var win = window;
  var doc = document;

  function $(selector) {
    var context = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

    if (!selector) return;

    return (context == null ? doc : context).querySelector(selector);
  }

  function $$(selector) {
    var context = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

    if (!selector) return;

    return (context == null ? doc : context).querySelectorAll(selector);
  }

  function matches(el, selector) {
    var results = (el.document || el.ownerDocument).querySelectorAll(selector);
    var i = results.length;
    while (--i >= 0 && results.item(i) !== el) {}

    return i > -1;
  }

  var directionMethodMap = {
    y: "scrollTop",
    x: "scrollLeft"
  };

  var directionPropMap = {
    y: "pageYOffset",
    x: "pageXOffset"
  };

  function isRootContainer(el) {
    return el === doc.documentElement || el === doc.body;
  }

  function getZoomLevel() {
    var _window = window;
    var outerWidth = _window.outerWidth;
    var innerWidth = _window.innerWidth;


    return outerWidth ? outerWidth / innerWidth : 1;
  }

  function getScrollable(selectors) {
    var direction = arguments.length <= 1 || arguments[1] === undefined ? "y" : arguments[1];
    var all = arguments.length <= 2 || arguments[2] === undefined ? true : arguments[2];

    var method = directionMethodMap[direction];
    var elements = selectors instanceof Element ? [selectors] : $$(selectors);
    var scrollables = [];
    var $div = doc.createElement("div");

    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];

      if (el[method] > 0) {
        scrollables.push(el);
      } else {
        $div.style.width = el.clientWidth + 1 + "px";
        $div.style.height = el.clientHeight + 1 + "px";
        el.appendChild($div);

        el[method] = 1.5 / getZoomLevel();
        if (el[method] > 0) {
          scrollables.push(el);
        }
        el[method] = 0;

        el.removeChild($div);
      }

      if (!all && scrollables.length > 0) break;
    }

    return scrollables;
  }

  function scrollableFind(selectors, direction) {
    var scrollables = getScrollable(selectors, direction, false);

    return scrollables.length >= 1 ? scrollables[0] : null;
  }

  function getWindow(el) {
    return el != null && el === el.window ? el : el.nodeType === 9 && el.defaultView;
  }

  function getHeight(el) {
    return max(el.scrollHeight, el.clientHeight, el.offsetHeight);
  }

  function getWidth(el) {
    return max(el.scrollWidth, el.clientWidth, el.offsetWidth);
  }

  function getSize(el) {
    return {
      width: getWidth(el),
      height: getHeight(el)
    };
  }

  function getDocumentSize() {
    return {
      width: max(getWidth(doc.body), getWidth(doc.documentElement)),
      height: max(getHeight(doc.body), getHeight(doc.documentElement))
    };
  }

  function getViewportAndElementSizes(el) {
    if (isRootContainer(el)) {
      return {
        viewport: {
          width: min(win.innerWidth, doc.documentElement.clientWidth),
          height: win.innerHeight
        },
        size: getDocumentSize()
      };
    }

    return {
      viewport: {
        width: el.clientWidth,
        height: el.clientHeight
      },
      size: getSize(el)
    };
  }

  function getScroll(el) {
    var direction = arguments.length <= 1 || arguments[1] === undefined ? "y" : arguments[1];

    var currentWindow = getWindow(el);

    return currentWindow ? currentWindow[directionPropMap[direction]] : el[directionMethodMap[direction]];
  }

  function setScroll(el, offset) {
    var direction = arguments.length <= 2 || arguments[2] === undefined ? "y" : arguments[2];

    var currentWindow = getWindow(el);
    var top = direction === "y";
    if (currentWindow) {
      currentWindow.scrollTo(!top ? offset : currentWindow[directionPropMap.x], top ? offset : currentWindow[directionPropMap.y]);
    } else {
      el[directionMethodMap[direction]] = offset;
    }
  }

  function getOffset(el) {
    var context = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

    if (!el || el && !el.getClientRects().length) {
      return { top: 0, left: 0 };
    }

    var rect = el.getBoundingClientRect();

    if (rect.width || rect.height) {
      var scroll = {};
      var ctx = null;
      if (context == null || isRootContainer(context)) {
        ctx = el.ownerDocument.documentElement;
        scroll.top = win.pageYOffset;
        scroll.left = win.pageXOffset;
      } else {
        ctx = context;
        var ctxRect = ctx.getBoundingClientRect();
        scroll.top = ctxRect.top * -1 + ctx.scrollTop;
        scroll.left = ctxRect.left * -1 + ctx.scrollLeft;
      }

      return {
        top: rect.top + scroll.top - ctx.clientTop,
        left: rect.left + scroll.left - ctx.clientLeft
      };
    }

    return rect;
  }

  // @link https://github.com/Modernizr/Modernizr
  var history = function () {
    var ua = navigator.userAgent;
    if ((ua.indexOf("Android 2.") !== -1 || ua.indexOf("Android 4.0") !== -1) && ua.indexOf("Mobile Safari") !== -1 && ua.indexOf("Chrome") === -1 && ua.indexOf("Windows Phone") === -1) {
      return false;
    }

    return window.history && "pushState" in window.history && window.location.protocol !== "file:";
  }();

  function addEvent(el, event, listener) {
    var events = event.split(",");
    events.forEach(function (eventName) {
      el.addEventListener(eventName.trim(), listener, false);
    });
  }

  function removeEvent(el, event, listener) {
    var events = event.split(",");
    events.forEach(function (eventName) {
      el.removeEventListener(eventName.trim(), listener, false);
    });
  }

  function linear(p) {
    return p;
  }

  function InQuad(x, t, b, c, d) {
    return c * (t /= d) * t + b;
  }

  function OutQuad(x, t, b, c, d) {
    return -c * (t /= d) * (t - 2) + b;
  }

  function InOutQuad(x, t, b, c, d) {
    if ((t /= d / 2) < 1) {
      return c / 2 * t * t + b;
    }
    return -c / 2 * (--t * (t - 2) - 1) + b;
  }

  function InCubic(x, t, b, c, d) {
    return c * (t /= d) * t * t + b;
  }

  function OutCubic(x, t, b, c, d) {
    return c * ((t = t / d - 1) * t * t + 1) + b;
  }

  function InOutCubic(x, t, b, c, d) {
    if ((t /= d / 2) < 1) {
      return c / 2 * t * t * t + b;
    }
    return c / 2 * ((t -= 2) * t * t + 2) + b;
  }

  function InQuart(x, t, b, c, d) {
    return c * (t /= d) * t * t * t + b;
  }

  function OutQuart(x, t, b, c, d) {
    return -c * ((t = t / d - 1) * t * t * t - 1) + b;
  }

  function InOutQuart(x, t, b, c, d) {
    if ((t /= d / 2) < 1) {
      return c / 2 * t * t * t * t + b;
    }
    return -c / 2 * ((t -= 2) * t * t * t - 2) + b;
  }

  function InQuint(x, t, b, c, d) {
    return c * (t /= d) * t * t * t * t + b;
  }

  function OutQuint(x, t, b, c, d) {
    return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
  }

  function InOutQuint(x, t, b, c, d) {
    if ((t /= d / 2) < 1) {
      return c / 2 * t * t * t * t * t + b;
    }
    return c / 2 * ((t -= 2) * t * t * t * t + 2) + b;
  }

  function InSine(x, t, b, c, d) {
    return -c * cos(t / d * (PI / 2)) + c + b;
  }

  function OutSine(x, t, b, c, d) {
    return c * sin(t / d * (PI / 2)) + b;
  }

  function InOutSine(x, t, b, c, d) {
    return -c / 2 * (cos(PI * t / d) - 1) + b;
  }

  function InExpo(x, t, b, c, d) {
    return t === 0 ? b : c * pow(2, 10 * (t / d - 1)) + b;
  }

  function OutExpo(x, t, b, c, d) {
    return t === d ? b + c : c * (-pow(2, -10 * t / d) + 1) + b;
  }

  function InOutExpo(x, t, b, c, d) {
    if (t === 0) return b;
    if (t === d) return b + c;
    if ((t /= d / 2) < 1) return c / 2 * pow(2, 10 * (t - 1)) + b;
    return c / 2 * (-pow(2, -10 * --t) + 2) + b;
  }

  function InCirc(x, t, b, c, d) {
    return -c * (sqrt(1 - (t /= d) * t) - 1) + b;
  }

  function OutCirc(x, t, b, c, d) {
    return c * sqrt(1 - (t = t / d - 1) * t) + b;
  }

  function InOutCirc(x, t, b, c, d) {
    if ((t /= d / 2) < 1) {
      return -c / 2 * (sqrt(1 - t * t) - 1) + b;
    }
    return c / 2 * (sqrt(1 - (t -= 2) * t) + 1) + b;
  }

  function InElastic(x, t, b, c, d) {
    var s = 1.70158;
    var p = 0;
    var a = c;
    if (t === 0) return b;
    if ((t /= d) === 1) return b + c;
    if (!p) p = d * .3;
    if (a < abs(c)) {
      a = c;
      s = p / 4;
    } else {
      s = p / (2 * PI) * asin(c / a);
    }
    return -(a * pow(2, 10 * (t -= 1)) * sin((t * d - s) * (2 * PI) / p)) + b;
  }

  function OutElastic(x, t, b, c, d) {
    var s = 1.70158;
    var p = 0;
    var a = c;
    if (t === 0) return b;
    if ((t /= d) === 1) return b + c;
    if (!p) p = d * .3;
    if (a < abs(c)) {
      a = c;
      s = p / 4;
    } else {
      s = p / (2 * PI) * asin(c / a);
    }
    return a * pow(2, -10 * t) * sin((t * d - s) * (2 * PI) / p) + c + b;
  }

  function InOutElastic(x, t, b, c, d) {
    var s = 1.70158;
    var p = 0;
    var a = c;
    if (t === 0) return b;
    if ((t /= d / 2) === 2) return b + c;
    if (!p) p = d * (.3 * 1.5);
    if (a < abs(c)) {
      a = c;
      s = p / 4;
    } else {
      s = p / (2 * PI) * asin(c / a);
    }
    if (t < 1) {
      return -.5 * (a * pow(2, 10 * (t -= 1)) * sin((t * d - s) * (2 * PI) / p)) + b;
    }
    return a * pow(2, -10 * (t -= 1)) * sin((t * d - s) * (2 * PI) / p) * .5 + c + b;
  }

  function InBack(x, t, b, c, d) {
    var s = arguments.length <= 5 || arguments[5] === undefined ? 1.70158 : arguments[5];

    return c * (t /= d) * t * ((s + 1) * t - s) + b;
  }

  function OutBack(x, t, b, c, d) {
    var s = arguments.length <= 5 || arguments[5] === undefined ? 1.70158 : arguments[5];

    return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
  }

  function InOutBack(x, t, b, c, d) {
    var s = arguments.length <= 5 || arguments[5] === undefined ? 1.70158 : arguments[5];

    if ((t /= d / 2) < 1) {
      return c / 2 * (t * t * (((s *= 1.525) + 1) * t - s)) + b;
    }
    return c / 2 * ((t -= 2) * t * (((s *= 1.525) + 1) * t + s) + 2) + b;
  }

  function OutBounce(x, t, b, c, d) {
    if ((t /= d) < 1 / 2.75) {
      return c * (7.5625 * t * t) + b;
    } else if (t < 2 / 2.75) {
      return c * (7.5625 * (t -= 1.5 / 2.75) * t + .75) + b;
    } else if (t < 2.5 / 2.75) {
      return c * (7.5625 * (t -= 2.25 / 2.75) * t + .9375) + b;
    } else {
      return c * (7.5625 * (t -= 2.625 / 2.75) * t + .984375) + b;
    }
  }

  function InBounce(x, t, b, c, d) {
    return c - OutBounce(x, d - t, 0, c, d) + b;
  }

  function InOutBounce(x, t, b, c, d) {
    if (t < d / 2) {
      return InBounce(x, t * 2, 0, c, d) * .5 + b;
    }
    return OutBounce(x, t * 2 - d, 0, c, d) * .5 + c * .5 + b;
  }

var Easing = Object.freeze({
    linear: linear,
    InQuad: InQuad,
    OutQuad: OutQuad,
    InOutQuad: InOutQuad,
    InCubic: InCubic,
    OutCubic: OutCubic,
    InOutCubic: InOutCubic,
    InQuart: InQuart,
    OutQuart: OutQuart,
    InOutQuart: InOutQuart,
    InQuint: InQuint,
    OutQuint: OutQuint,
    InOutQuint: InOutQuint,
    InSine: InSine,
    OutSine: OutSine,
    InOutSine: InOutSine,
    InExpo: InExpo,
    OutExpo: OutExpo,
    InOutExpo: InOutExpo,
    InCirc: InCirc,
    OutCirc: OutCirc,
    InOutCirc: InOutCirc,
    InElastic: InElastic,
    OutElastic: OutElastic,
    InOutElastic: InOutElastic,
    InBack: InBack,
    OutBack: OutBack,
    InOutBack: InOutBack,
    OutBounce: OutBounce,
    InBounce: InBounce,
    InOutBounce: InOutBounce
  });

  var vendors = ["ms", "moz", "webkit"];
  var lastTime = 0;

  var raf = win.requestAnimationFrame;
  var caf = win.cancelAnimationFrame;

  for (var x = 0; x < vendors.length && !raf; ++x) {
    raf = win[vendors[x] + "RequestAnimationFrame"];
    caf = win[vendors[x] + "CancelAnimationFrame"] || win[vendors[x] + "CancelRequestAnimationFrame"];
  }

  if (!raf) {
    raf = function raf(callback) {
      var currentTime = Date.now();
      var timeToCall = max(0, 16 - (currentTime - lastTime));
      var id = setTimeout(function () {
        callback(currentTime + timeToCall);
      }, timeToCall);

      lastTime = currentTime + timeToCall;

      return id;
    };
  }

  if (!caf) {
    caf = function caf(id) {
      clearTimeout(id);
    };
  }

  var ScrollTween = function () {
    function ScrollTween(el) {
      classCallCheck(this, ScrollTween);

      this.el = el;
      this.props = {};
      this.options = {};
      this.progress = false;
      this.easing = null;
      this.startTime = null;
      this.rafId = null;
    }

    createClass(ScrollTween, [{
      key: "run",
      value: function run(x, y, options) {
        var _this = this;

        if (this.progress) return;
        this.props = { x: x, y: y };
        this.options = options;
        this.easing = isFunction(options.easing) ? options.easing : Easing[options.easing.replace("ease", "")];
        this.progress = true;

        setTimeout(function () {
          _this.startProps = {
            x: getScroll(_this.el, "x"),
            y: getScroll(_this.el, "y")
          };
          _this.rafId = raf(function (time) {
            return _this._loop(time);
          });
        }, this.options.delay);
      }
    }, {
      key: "stop",
      value: function stop() {
        var gotoEnd = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];
        var complete = this.options.complete;

        this.startTime = null;
        this.progress = false;
        caf(this.rafId);

        if (gotoEnd) {
          setScroll(this.el, this.props.x, "x");
          setScroll(this.el, this.props.y, "y");
        }

        if (isFunction(complete)) {
          complete.call(this);
          this.options.complete = null;
        }
      }
    }, {
      key: "_loop",
      value: function _loop(time) {
        var _this2 = this;

        if (!this.startTime) {
          this.startTime = time;
        }

        if (!this.progress) {
          this.stop(false);

          return;
        }

        var el = this.el;
        var props = this.props;
        var options = this.options;
        var startTime = this.startTime;
        var startProps = this.startProps;
        var easing = this.easing;
        var duration = options.duration;
        var step = options.step;

        var toProps = {};
        var timeElapsed = time - startTime;
        var t = min(1, max(timeElapsed / duration, 0));

        each(props, function (value, key) {
          var initialValue = startProps[key];
          var delta = value - initialValue;
          if (delta === 0) return true;

          var val = easing(t, duration * t, 0, 1, duration);
          toProps[key] = round(initialValue + delta * val);
        });

        each(toProps, function (value, key) {
          setScroll(el, value, key);
        });

        if (timeElapsed <= duration) {
          step.call(this, t, toProps);
          this.rafId = raf(function (currentTime) {
            return _this2._loop(currentTime);
          });
        } else {
          this.stop(true);
        }
      }
    }]);
    return ScrollTween;
  }();

  var WHEEL_EVENT = function () {
    if ("onwheel" in doc) {
      return "wheel";
    } else if ("onmousewheel" in doc) {
      return "mousewheel";
    } else {
      return "DOMMouseScroll";
    }
  }();

  var CONTAINER_STOP_EVENTS = WHEEL_EVENT + ", touchstart, touchmove";
  var DOM_CONTENT_LOADED = "DOMContentLoaded";
  var isDomContentLoaded = false;

  addEvent(doc, DOM_CONTENT_LOADED, function () {
    isDomContentLoaded = true;
  });

  var SweetScroll = function () {

    /* eslint-enable max-len */

    /**
     * SweetScroll constructor
     * @constructor
     * @param {Object} options
     * @param {String | Element} container
     */

    function SweetScroll() {
      var _this = this;

      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
      var container = arguments.length <= 1 || arguments[1] === undefined ? "body, html" : arguments[1];
      classCallCheck(this, SweetScroll);

      var params = merge({}, SweetScroll.defaults, options);

      this.options = params;
      this.getContainer(container, function (target) {
        _this.container = target;
        _this.header = $(params.header);
        _this.tween = new ScrollTween(target);
        _this._trigger = null;
        _this._shouldCallCancelScroll = false;
        _this.bindContainerClick();
        _this.hook(params, "initialized");
      });
    }

    /**
     * Scroll animation to the specified position
     * @param {*} distance
     * @param {Object} options
     * @return {void}
     */


    // Default options
    /* eslint-disable max-len */


    createClass(SweetScroll, [{
      key: "to",
      value: function to(distance) {
        var _this2 = this;

        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var container = this.container;
        var header = this.header;

        var params = merge({}, this.options, options);

        // Temporary options
        this._options = params;

        var offset = this.parseCoodinate(params.offset);
        var trigger = this._trigger;
        var scroll = this.parseCoodinate(distance);
        var hash = null;

        // Remove the triggering elements which has been temporarily retained
        this._trigger = null;

        // Disable the call flag of `cancelScroll`
        this._shouldCallCancelScroll = false;

        // Stop current animation
        this.stop();

        // Does not move if the container is not found
        if (!container) return;

        // Using the coordinates in the case of CSS Selector
        if (!scroll && isString(distance)) {
          hash = /^#/.test(distance) ? distance : null;

          if (distance === "#") {
            scroll = {
              top: 0,
              left: 0
            };
          } else {
            var target = $(distance);
            var targetOffset = getOffset(target, container);
            if (!targetOffset) return;
            scroll = targetOffset;
          }
        }

        if (!scroll) return;

        // Apply `offset` value
        if (offset) {
          scroll.top += offset.top;
          scroll.left += offset.left;
        }

        // If the header is present apply the height
        if (header) {
          scroll.top = max(0, scroll.top - getSize(header).height);
        }

        // Determine the final scroll coordinates

        var _Dom$getViewportAndEl = getViewportAndElementSizes(container);

        var viewport = _Dom$getViewportAndEl.viewport;
        var size = _Dom$getViewportAndEl.size;

        // Call `beforeScroll`
        // Stop scrolling when it returns false

        if (this.hook(params, "beforeScroll", scroll, trigger) === false) {
          return;
        }

        // Adjustment of the maximum value
        scroll.top = params.verticalScroll ? max(0, min(size.height - viewport.height, scroll.top)) : getScroll(container, "y");
        scroll.left = params.horizontalScroll ? max(0, min(size.width - viewport.width, scroll.left)) : getScroll(container, "x");

        // Run the animation!!
        this.tween.run(scroll.left, scroll.top, {
          duration: params.duration,
          delay: params.delay,
          easing: params.easing,
          complete: function complete() {
            // Update URL
            if (hash != null && hash !== window.location.hash) {
              _this2.updateURLHash(hash, params.updateURL);
            }

            // Unbind the scroll stop events, And call `afterScroll` or `cancelScroll`
            _this2.unbindContainerStop();

            // Remove the temporary options
            _this2._options = null;

            // Call `cancelScroll` or `afterScroll`
            if (_this2._shouldCallCancelScroll) {
              _this2.hook(params, "cancelScroll");
            } else {
              _this2.hook(params, "afterScroll", scroll, trigger);
            }

            // Call `completeScroll`
            _this2.hook(params, "completeScroll", _this2._shouldCallCancelScroll);
          },
          step: function step(currentTime, props) {
            _this2.hook(params, "stepScroll", currentTime, props);
          }
        });

        // Bind the scroll stop events
        this.bindContainerStop();
      }

      /**
       * Scroll animation to the specified top position
       * @param {*} distance
       * @param {Object} options
       * @return {void}
       */

    }, {
      key: "toTop",
      value: function toTop(distance) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

        this.to(distance, merge({}, options, {
          verticalScroll: true,
          horizontalScroll: false
        }));
      }

      /**
       * Scroll animation to the specified left position
       * @param {*} distance
       * @param {Object} options
       * @return {void}
       */

    }, {
      key: "toLeft",
      value: function toLeft(distance) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

        this.to(distance, merge({}, options, {
          verticalScroll: false,
          horizontalScroll: true
        }));
      }

      /**
       * Scroll animation to the specified element
       * @param {Element} el
       * @param {Object} options
       * @return {void}
       */

    }, {
      key: "toElement",
      value: function toElement(el) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

        if (el instanceof Element) {
          var offset = getOffset(el, this.container);
          this.to(offset, merge({}, options));
        }
      }

      /**
       * Stop the current animation
       * @param {Boolean} gotoEnd
       * @return {void}
       */

    }, {
      key: "stop",
      value: function stop() {
        var gotoEnd = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

        if (this._stopScrollListener) {
          this._shouldCallCancelScroll = true;
        }
        this.tween.stop(gotoEnd);
      }

      /**
       * Update the instance
       * @param {Object} options
       * @return {void}
       */

    }, {
      key: "update",
      value: function update() {
        var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        this.stop();
        this.unbindContainerClick();
        this.unbindContainerStop();
        this.options = merge({}, this.options, options);
        this.header = $(this.options.header);
        this.bindContainerClick();
      }

      /**
       * Destroy SweetScroll instance
       * @return {void}
       */

    }, {
      key: "destroy",
      value: function destroy() {
        this.stop();
        this.unbindContainerClick();
        this.unbindContainerStop();
        this.container = null;
        this.header = null;
        this.tween = null;
      }

      /**
       * Called at after of the initialize.
       * @return {void}
       */

    }, {
      key: "initialized",
      value: function initialized() {}

      /**
       * Called at before of the scroll.
       * @param {Object} toScroll
       * @param {Element} trigger
       * @return {Boolean}
       */
      /* eslint-disable no-unused-vars */

    }, {
      key: "beforeScroll",
      value: function beforeScroll(toScroll, trigger) {
        return true;
      }

      /* eslint-enable no-unused-vars */

      /**
       * Called at cancel of the scroll.
       * @return {void}
       */

    }, {
      key: "cancelScroll",
      value: function cancelScroll() {}

      /**
       * Called at after of the scroll.
       * @param {Object} toScroll
       * @param {Element} trigger
       * @return {void}
       */
      /* eslint-disable no-unused-vars */

    }, {
      key: "afterScroll",
      value: function afterScroll(toScroll, trigger) {}

      /* eslint-enable no-unused-vars */

      /**
       * Called at complete of the scroll.
       * @param {Boolean} isCancel
       * @return {void}
       */
      /* eslint-disable no-unused-vars */

    }, {
      key: "completeScroll",
      value: function completeScroll(isCancel) {}

      /* eslint-enable no-unused-vars */

      /**
       * Called at each animation frame of the scroll.
       * @param {Float} currentTime
       * @param {Object} props
       * @return {void}
       */
      /* eslint-disable no-unused-vars */

    }, {
      key: "stepScroll",
      value: function stepScroll(currentTime, props) {}

      /* eslint-enable no-unused-vars */

      /**
       * Parse the value of coordinate
       * @param {*} coodinate
       * @return {Object}
       */

    }, {
      key: "parseCoodinate",
      value: function parseCoodinate(coodinate) {
        var enableTop = this._options ? this._options.verticalScroll : this.options.verticalScroll;
        var scroll = { top: 0, left: 0 };

        // Object
        if (hasProp(coodinate, "top") || hasProp(coodinate, "left")) {
          scroll = merge(scroll, coodinate);

          // Array
        } else if (isArray(coodinate)) {
          if (coodinate.length === 2) {
            scroll.top = coodinate[0];
            scroll.left = coodinate[1];
          } else {
            scroll.top = enableTop ? coodinate[0] : 0;
            scroll.left = !enableTop ? coodinate[0] : 0;
          }

          // Number
        } else if (isNumeric(coodinate)) {
          scroll.top = enableTop ? coodinate : 0;
          scroll.left = !enableTop ? coodinate : 0;

          // String
        } else if (isString(coodinate)) {
          var trimedCoodinate = removeSpaces(coodinate);

          // "{n},{n}" (Array like syntax)
          if (/^\d+,\d+$/.test(trimedCoodinate)) {
            trimedCoodinate = trimedCoodinate.split(",");
            scroll.top = trimedCoodinate[0];
            scroll.left = trimedCoodinate[1];

            // "top:{n}, left:{n}" (Object like syntax)
          } else if (/^(top|left):\d+,?(?:(top|left):\d+)?$/.test(trimedCoodinate)) {
            var top = trimedCoodinate.match(/top:(\d+)/);
            var left = trimedCoodinate.match(/left:(\d+)/);
            scroll.top = top ? top[1] : 0;
            scroll.left = left ? left[1] : 0;

            // "+={n}", "-={n}" (Relative position)
          } else if (this.container && /^(\+|-)=(\d+)$/.test(trimedCoodinate)) {
            var current = getScroll(this.container, enableTop ? "y" : "x");
            var results = trimedCoodinate.match(/^(\+|-)=(\d+)$/);
            var op = results[1];
            var value = parseInt(results[2], 10);
            if (op === "+") {
              scroll.top = enableTop ? current + value : 0;
              scroll.left = !enableTop ? current + value : 0;
            } else {
              scroll.top = enableTop ? current - value : 0;
              scroll.left = !enableTop ? current - value : 0;
            }
          } else {
            return null;
          }
        } else {
          return null;
        }

        scroll.top = parseInt(scroll.top, 10);
        scroll.left = parseInt(scroll.left, 10);

        return scroll;
      }

      /**
       * Update the Hash of the URL.
       * @param {String} hash
       * @param {Boolean | String} historyType
       * @return {void}
       */

    }, {
      key: "updateURLHash",
      value: function updateURLHash(hash, historyType) {
        if (!history || !historyType) return;
        window.history[historyType === "replace" ? "replaceState" : "pushState"](null, null, hash);
      }

      /**
       * Get the container for the scroll, depending on the options.
       * @param {String | Element} selector
       * @param {Function} callback
       * @return {void}
       * @private
       */

    }, {
      key: "getContainer",
      value: function getContainer(selector, callback) {
        var _this3 = this;

        var _options = this.options;
        var verticalScroll = _options.verticalScroll;
        var horizontalScroll = _options.horizontalScroll;

        var container = null;

        if (verticalScroll) {
          container = scrollableFind(selector, "y");
        }

        if (!container && horizontalScroll) {
          container = scrollableFind(selector, "x");
        }

        if (!container && !isDomContentLoaded) {
          (function () {
            var isCompleted = false;

            addEvent(doc, DOM_CONTENT_LOADED, function () {
              isCompleted = true;
              _this3.getContainer(selector, callback);
            });

            // Fallback for DOMContentLoaded
            addEvent(win, "load", function () {
              if (!isCompleted) {
                _this3.getContainer(selector, callback);
              }
            });
          })();
        } else {
          callback.call(this, container);
        }
      }

      /**
       * Bind a click event to the container
       * @return {void}
       * @private
       */

    }, {
      key: "bindContainerClick",
      value: function bindContainerClick() {
        var container = this.container;

        if (!container) return;
        this._containerClickListener = this.handleContainerClick.bind(this);
        addEvent(container, "click", this._containerClickListener);
      }

      /**
       * Unbind a click event to the container
       * @return {void}
       * @private
       */

    }, {
      key: "unbindContainerClick",
      value: function unbindContainerClick() {
        var container = this.container;

        if (!container || !this._containerClickListener) return;
        removeEvent(container, "click", this._containerClickListener);
        this._containerClickListener = null;
      }

      /**
       * Bind the scroll stop of events
       * @return {void}
       * @private
       */

    }, {
      key: "bindContainerStop",
      value: function bindContainerStop() {
        var container = this.container;

        if (!container) return;
        this._stopScrollListener = this.handleStopScroll.bind(this);
        addEvent(container, CONTAINER_STOP_EVENTS, this._stopScrollListener);
      }

      /**
       * Unbind the scroll stop of events
       * @return {void}
       * @private
       */

    }, {
      key: "unbindContainerStop",
      value: function unbindContainerStop() {
        var container = this.container;

        if (!container || !this._stopScrollListener) return;
        removeEvent(container, CONTAINER_STOP_EVENTS, this._stopScrollListener);
        this._stopScrollListener = null;
      }

      /**
       * Call the specified callback
       * @param {Object} options
       * @param {String} type
       * @param {...*} args
       * @return {void}
       * @private
       */

    }, {
      key: "hook",
      value: function hook(options, type) {
        var callback = options[type];

        // callback

        for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
          args[_key - 2] = arguments[_key];
        }

        if (isFunction(callback)) {
          var result = callback.apply(this, args);
          if (typeof result === "undefined") return result;
        }

        // method
        return this[type].apply(this, args);
      }

      /**
       * Handling of scroll stop event
       * @param {Event} e
       * @return {void}
       * @private
       */

    }, {
      key: "handleStopScroll",
      value: function handleStopScroll(e) {
        var stopScroll = this._options ? this._options.stopScroll : this.options.stopScroll;
        if (stopScroll) {
          this.stop();
        } else {
          e.preventDefault();
        }
      }

      /**
       * Handling of container click event
       * @param {Event} e
       * @return {void}
       * @private
       */

    }, {
      key: "handleContainerClick",
      value: function handleContainerClick(e) {
        var options = this.options;

        var el = e.target;

        // Explore parent element until the trigger selector matches
        for (; el && el !== doc; el = el.parentNode) {
          if (!matches(el, options.trigger)) continue;
          var data = el.getAttribute("data-scroll");
          var dataOptions = this.parseDataOptions(el);
          var href = data || el.getAttribute("href");

          options = merge({}, options, dataOptions);

          if (options.preventDefault) e.preventDefault();
          if (options.stopPropagation) e.stopPropagation();

          // Passes the trigger elements to callback
          this._trigger = el;

          if (options.horizontalScroll && options.verticalScroll) {
            this.to(href, options);
          } else if (options.verticalScroll) {
            this.toTop(href, options);
          } else if (options.horizontalScroll) {
            this.toLeft(href, options);
          }
        }
      }

      /**
       * Parse the data-scroll-options attribute
       * @param {Element} el
       * @return {Object}
       * @private
       */

    }, {
      key: "parseDataOptions",
      value: function parseDataOptions(el) {
        var options = el.getAttribute("data-scroll-options");

        return options ? JSON.parse(options) : {};
      }
    }]);
    return SweetScroll;
  }();

  // Export SweetScroll class


  SweetScroll.defaults = {
    trigger: "[data-scroll]", // Selector for trigger (must be a valid css selector)
    header: "[data-scroll-header]", // Selector for fixed header (must be a valid css selector)
    duration: 1000, // Specifies animation duration in integer
    delay: 0, // Specifies timer for delaying the execution of the scroll in milliseconds
    easing: "easeOutQuint", // Specifies the pattern of easing
    offset: 0, // Specifies the value to offset the scroll position in pixels
    verticalScroll: true, // Enable the vertical scroll
    horizontalScroll: false, // Enable the horizontal scroll
    stopScroll: true, // When fired wheel or touchstart events to stop scrolling
    updateURL: false, // Update the URL hash on after scroll (true | false | "push" | "replace")
    preventDefault: true, // Cancels the container element click event
    stopPropagation: true, // Prevents further propagation of the container element click event in the bubbling phase

    // Callbacks
    initialized: null,
    beforeScroll: null,
    afterScroll: null,
    cancelScroll: null,
    completeScroll: null,
    stepScroll: null
  };

  return SweetScroll;

}));
},{}],4:[function(require,module,exports){
var Collapse=require('bootstrap.native/lib/collapse-native.js');
var AnchorJS=require('anchor-js');
var SweetScroll=require('sweet-scroll');
// Init AnchorJS:
var anchors=new AnchorJS({
  visible: 'touch',
  icon: '#'
}).add('h2');
// Generate TOC:
generateTableOfContents(anchors.elements);
// Init SweetScroll for TOC:
new SweetScroll({
  trigger: '.nav-item a',
  offset: -60,
  updateURL: true
});
// Init SweetScroll for back-top:
new SweetScroll({
  completeScroll(isCancel){
    history.pushState("", document.title, window.location.pathname);
  }
});
// Get navCollapse and auto-close nav onclick:
var navCollapse=new Collapse(document.getElementById('nav-collapse'));
Array.prototype.slice.call(document.querySelectorAll('.nav-item')).forEach(function (elem) {
  elem.addEventListener('click', function () {
    navCollapse.close();
  });
});
// Add pictures:
// FIXME: set container width, investigate logo centering
if (innerWidth>1024) {
  loadPictures();
}
function loadPictures() {
  var l=document.getElementById('imgl')
  l.src='img/rzf.jpg';
  l.alt='Roland Zimmerman Family';
  // Clear display: none;
  l.style='';
  var r=document.getElementById('imgr')
  r.src='img/ehk.jpg';
  r.alt='Ed and Helen Kurtz';
  // Clear display: none;
  r.style='';
}
// External code for generating a simple dynamic Table of Contents
function generateTableOfContents(els) {
	var anchoredElText;
  var anchoredElHref;
	var ul = document.createElement('UL');
  ul.className='nav navbar-nav';
  document.getElementById('TOC').appendChild(ul);
	els.forEach(function (elem, i) {
  	anchoredElText = elem.textContent;
		anchoredElHref = elem.querySelector('.anchorjs-link').getAttribute('href');
  	addNavItem(ul, anchoredElHref, anchoredElText);
  });
}
function addNavItem(ul, href, text) {
  var listItem = document.createElement('LI');
	var anchorItem = document.createElement('A');
  var textNode = document.createTextNode(text.replace(':', ''));
  listItem.className='nav-item';
  anchorItem.href = href;
  ul.appendChild(listItem);
  listItem.appendChild(anchorItem);
  anchorItem.appendChild(textNode);
}

},{"anchor-js":1,"bootstrap.native/lib/collapse-native.js":2,"sweet-scroll":3}]},{},[4]);
