/* @ds-bundle: {"format":4,"namespace":"AirtableMarketingDesignSystem_58d612","components":[{"name":"Icon","sourcePath":"components/brand/Icon.jsx"},{"name":"Wordmark","sourcePath":"components/brand/Wordmark.jsx"},{"name":"Button","sourcePath":"components/buttons/Button.jsx"},{"name":"IconButton","sourcePath":"components/buttons/IconButton.jsx"},{"name":"TextLink","sourcePath":"components/buttons/TextLink.jsx"},{"name":"TextInput","sourcePath":"components/forms/TextInput.jsx"},{"name":"Band","sourcePath":"components/layout/Band.jsx"},{"name":"CardGrid","sourcePath":"components/layout/CardGrid.jsx"},{"name":"Footer","sourcePath":"components/navigation/Footer.jsx"},{"name":"TopNav","sourcePath":"components/navigation/TopNav.jsx"},{"name":"TopicFilterRail","sourcePath":"components/navigation/TopicFilterRail.jsx"},{"name":"PricingComparisonRow","sourcePath":"components/pricing/PricingComparisonRow.jsx"},{"name":"PricingTierCard","sourcePath":"components/pricing/PricingTierCard.jsx"},{"name":"RainbowStripeHero","sourcePath":"components/signature/RainbowStripeHero.jsx"},{"name":"ArticleCard","sourcePath":"components/surfaces/ArticleCard.jsx"},{"name":"CalloutCard","sourcePath":"components/surfaces/CalloutCard.jsx"},{"name":"CtaBand","sourcePath":"components/surfaces/CtaBand.jsx"},{"name":"DemoGridCard","sourcePath":"components/surfaces/DemoGridCard.jsx"},{"name":"FeatureCardTabbed","sourcePath":"components/surfaces/FeatureCardTabbed.jsx"},{"name":"HeroBand","sourcePath":"components/surfaces/HeroBand.jsx"},{"name":"LogoStrip","sourcePath":"components/surfaces/LogoStrip.jsx"},{"name":"MediaPlaceholder","sourcePath":"components/surfaces/MediaPlaceholder.jsx"},{"name":"SignatureCard","sourcePath":"components/surfaces/SignatureCard.jsx"}],"sourceHashes":{"components/brand/Icon.jsx":"72f028f2fbcb","components/brand/Wordmark.jsx":"febc57ef1ede","components/buttons/Button.jsx":"7d569aad1d89","components/buttons/IconButton.jsx":"f9092c79462c","components/buttons/TextLink.jsx":"17a7f875f195","components/forms/TextInput.jsx":"e54c8d9fe8aa","components/layout/Band.jsx":"bf00d97509fb","components/layout/CardGrid.jsx":"39e01c2c544d","components/navigation/Footer.jsx":"6516e8267b4f","components/navigation/TopNav.jsx":"348a2e6f9cc2","components/navigation/TopicFilterRail.jsx":"b1c07e4d5bfb","components/pricing/PricingComparisonRow.jsx":"386a287f7530","components/pricing/PricingTierCard.jsx":"69d6a350cfdc","components/signature/RainbowStripeHero.jsx":"721887d7f374","components/surfaces/ArticleCard.jsx":"6e3141cbeb6a","components/surfaces/CalloutCard.jsx":"4fc0427d884e","components/surfaces/CtaBand.jsx":"9c6602efb81a","components/surfaces/DemoGridCard.jsx":"175fe2dc9f4a","components/surfaces/FeatureCardTabbed.jsx":"0ce644833cee","components/surfaces/HeroBand.jsx":"365c057e45eb","components/surfaces/LogoStrip.jsx":"19a9e647ae91","components/surfaces/MediaPlaceholder.jsx":"b1cb05645521","components/surfaces/SignatureCard.jsx":"bae38afbf69a","ui_kits/marketing-site/Articles.jsx":"13fad78cbd78","ui_kits/marketing-site/Home.jsx":"9d0809e9dcb2","ui_kits/marketing-site/Pricing.jsx":"9942e760440f","ui_kits/marketing-site/Shell.jsx":"385df7fea45f","ui_kits/marketing-site/doc-page.js":"f52ae9c02fca"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.AirtableMarketingDesignSystem_58d612 = window.AirtableMarketingDesignSystem_58d612 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/brand/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (let e = 1; e < arguments.length; e++) { const t = arguments[e]; for (const r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CDN = 'https://unpkg.com/lucide-static@latest/icons/';
const iconCache = {};
function pascal(name) {
  return String(name).split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
}
function Icon({
  name,
  size = 20,
  strokeWidth = 2,
  style,
  ...rest
}) {
  const host = React.useRef(null);
  React.useEffect(() => {
    const el = host.current;
    if (!el) return;
    let live = true;
    const paint = svg => {
      if (!live || !svg) return;
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '100%');
      svg.setAttribute('stroke-width', String(strokeWidth));
      el.replaceChildren(svg);
    };
    const lucide = typeof window !== 'undefined' ? window.lucide : null;
    const node = lucide && lucide.icons ? lucide.icons[pascal(name)] : null;
    if (node && lucide.createElement) {
      paint(lucide.createElement(node));
      return () => {
        live = false;
      };
    }
    if (!iconCache[name]) {
      iconCache[name] = fetch(CDN + name + '.svg').then(r => r.ok ? r.text() : '').catch(() => '');
    }
    iconCache[name].then(text => {
      if (!live || !text) return;
      const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
      const svg = doc.documentElement;
      if (svg && svg.nodeName === 'svg') paint(svg);
    });
    return () => {
      live = false;
    };
  }, [name, strokeWidth]);
  return /*#__PURE__*/React.createElement("span", _extends({
    "aria-hidden": "true",
    ref: host,
    style: {
      display: 'inline-flex',
      width: size,
      height: size,
      flex: '0 0 auto',
      color: 'inherit',
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/Icon.jsx", error: String((e && e.message) || e) }); }

// components/brand/Wordmark.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (let e = 1; e < arguments.length; e++) { const t = arguments[e]; for (const r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Wordmark({
  name = 'Airtable',
  size = 20,
  tone = 'ink',
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      font: 'var(--text-title-md)',
      fontVariationSettings: 'var(--font-display-settings)',
      fontSize: size,
      fontWeight: 'var(--weight-medium)',
      letterSpacing: '-0.01em',
      lineHeight: 1,
      color: tone === 'onDark' ? 'var(--text-on-dark)' : 'var(--text-strong)',
      ...style
    }
  }, rest), name);
}
Object.assign(__ds_scope, { Wordmark });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/Wordmark.jsx", error: String((e && e.message) || e) }); }

// components/buttons/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (let e = 1; e < arguments.length; e++) { const t = arguments[e]; for (const r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const buttonBase = {
  font: 'var(--text-button)',
  fontVariationSettings: 'var(--font-text-settings)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--space-xs)',
  border: 0,
  cursor: 'pointer',
  textDecoration: 'none',
  transition: 'background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard)'
};
const buttonVariants = {
  primary: {
    background: 'var(--action-primary)',
    color: 'var(--action-primary-fg)',
    padding: '16px 24px',
    borderRadius: 'var(--radius-button)',
    boxShadow: 'var(--shadow-button-rest)'
  },
  secondary: {
    background: 'var(--action-secondary)',
    color: 'var(--action-secondary-fg)',
    padding: '16px 24px',
    borderRadius: 'var(--radius-button)',
    boxShadow: 'inset 0 0 0 var(--hairline) var(--border-hairline)'
  },
  pricingPill: {
    background: 'var(--action-secondary)',
    color: 'var(--text-pricing)',
    padding: '12px 24px',
    borderRadius: 'var(--radius-button-pricing)',
    fontFamily: 'var(--font-pricing)',
    boxShadow: 'inset 0 0 0 var(--hairline) var(--border-hairline)'
  },
  legal: {
    background: 'var(--action-legal)',
    color: 'var(--action-primary-fg)',
    padding: '12px 10px',
    borderRadius: 'var(--radius-button-legal)',
    font: 'var(--text-legal)'
  }
};
const buttonSizes = {
  md: null,
  sm: {
    padding: '12px 16px'
  }
};
function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  pressed = false,
  href,
  icon,
  iconAfter,
  style,
  children,
  ...rest
}) {
  const v = buttonVariants[variant] || buttonVariants.primary;
  const s = {
    ...buttonBase,
    ...v,
    ...(buttonSizes[size] || null)
  };
  if (pressed && variant === 'primary') s.background = 'var(--action-primary-active)';
  if (pressed && variant === 'legal') s.background = 'var(--text-link-active)';
  if (disabled) {
    s.cursor = 'not-allowed';
    if (variant === 'primary') {
      s.background = 'var(--surface-strong)';
      s.color = 'var(--border-strong)';
      s.boxShadow = 'none';
    } else {
      s.color = 'var(--border-strong)';
      s.boxShadow = 'inset 0 0 0 var(--hairline) var(--border-strong)';
    }
  }
  const Tag = href && !disabled ? 'a' : 'button';
  return /*#__PURE__*/React.createElement(Tag, _extends({
    href,
    disabled: Tag === 'button' ? disabled : undefined,
    style: {
      ...s,
      ...style
    }
  }, rest), icon, children, iconAfter);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/buttons/Button.jsx", error: String((e && e.message) || e) }); }

// components/buttons/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (let e = 1; e < arguments.length; e++) { const t = arguments[e]; for (const r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function IconButton({
  label,
  size = 40,
  pressed = false,
  style,
  children,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("button", _extends({
    "aria-label": label,
    style: {
      width: size,
      height: size,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 'var(--radius-full)',
      background: pressed ? 'var(--surface-soft)' : 'var(--surface-canvas)',
      color: 'var(--text-strong)',
      border: 'var(--hairline) solid var(--border-hairline)',
      cursor: 'pointer',
      padding: 0,
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/buttons/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/buttons/TextLink.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (let e = 1; e < arguments.length; e++) { const t = arguments[e]; for (const r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function TextLink({
  href = '#',
  active = false,
  style,
  children,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("a", _extends({
    href,
    style: {
      color: active ? 'var(--text-link-active)' : 'var(--text-link)',
      font: 'var(--text-body-md)',
      textDecoration: 'none',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { TextLink });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/buttons/TextLink.jsx", error: String((e && e.message) || e) }); }

// components/forms/TextInput.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (let e = 1; e < arguments.length; e++) { const t = arguments[e]; for (const r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function TextInput({
  label,
  hint,
  focused = false,
  invalid = false,
  iconBefore,
  style,
  ...rest
}) {
  const [isFocus, setFocus] = React.useState(false);
  const showFocus = focused || isFocus;
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-xs)',
      ...style
    }
  }, label ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-caption)',
      letterSpacing: 'var(--track-caption)',
      color: 'var(--text-strong)'
    }
  }, label) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-xs)',
      height: 44,
      padding: '12px 16px',
      background: 'var(--surface-canvas)',
      borderRadius: 'var(--radius-input)',
      border: 'var(--hairline) solid ' + (invalid ? 'var(--action-legal)' : showFocus ? 'var(--border-focus)' : 'var(--border-hairline)'),
      boxShadow: showFocus ? 'var(--shadow-button-focus)' : 'none',
      color: 'var(--text-muted)',
      transition: 'border-color var(--dur-fast) var(--ease-standard)'
    }
  }, iconBefore, /*#__PURE__*/React.createElement("input", _extends({
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      font: 'var(--text-body-md)',
      color: 'var(--text-strong)',
      border: 0,
      outline: 'none',
      background: 'transparent',
      width: '100%',
      padding: 0
    }
  }, rest))), hint ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-body-md)',
      color: 'var(--text-muted)'
    }
  }, hint) : null);
}
Object.assign(__ds_scope, { TextInput });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/TextInput.jsx", error: String((e && e.message) || e) }); }

// components/layout/Band.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (let e = 1; e < arguments.length; e++) { const t = arguments[e]; for (const r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const bandSurfaces = {
  canvas: {
    background: 'var(--surface-canvas)',
    color: 'var(--text-body)'
  },
  soft: {
    background: 'var(--surface-soft)',
    color: 'var(--text-body)'
  },
  strong: {
    background: 'var(--surface-strong)',
    color: 'var(--text-body)'
  },
  dark: {
    background: 'var(--surface-dark)',
    color: 'var(--text-on-dark)'
  },
  cream: {
    background: 'var(--surface-callout-cream)',
    color: 'var(--text-body)'
  }
};
function Band({
  surface = 'canvas',
  pad = 'section',
  width = 'default',
  style,
  children,
  ...rest
}) {
  const pads = {
    section: 'var(--pad-band)',
    lg: 'var(--space-xxl)',
    sm: 'var(--space-xl)',
    none: '0'
  };
  return /*#__PURE__*/React.createElement("section", _extends({
    style: {
      ...(bandSurfaces[surface] || bandSurfaces.canvas),
      padding: (pads[pad] || pads.section) + ' var(--container-inset)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: width === 'narrow' ? '760px' : 'var(--container-max)',
      margin: '0 auto'
    }
  }, children));
}
Object.assign(__ds_scope, { Band });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/Band.jsx", error: String((e && e.message) || e) }); }

// components/layout/CardGrid.jsx
try { (() => {
function CardGrid({
  columns = 3,
  dense = false,
  style,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(' + (dense ? 200 : 260) + 'px, 1fr))',
      gap: dense ? 'var(--gutter-dense)' : 'var(--gutter-grid)',
      alignItems: 'start',
      ...style
    },
    "data-columns": columns
  }, children);
}
Object.assign(__ds_scope, { CardGrid });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/CardGrid.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Footer.jsx
try { (() => {
function Footer({
  columns = [],
  legal,
  style
}) {
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      background: 'var(--surface-canvas)',
      borderTop: 'var(--hairline) solid var(--border-hairline)',
      padding: 'var(--space-xxl) var(--container-inset)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-xxl)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))',
      gap: 'var(--gutter-dense)'
    }
  }, columns.map((c, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-sm)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-caption)',
      letterSpacing: 'var(--track-caption)',
      color: 'var(--text-strong)'
    }
  }, c.title), (c.links || []).map((l, j) => /*#__PURE__*/React.createElement("a", {
    key: j,
    href: "#",
    style: {
      font: 'var(--text-body-md)',
      color: 'var(--text-muted)'
    }
  }, l))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-lg)',
      flexWrap: 'wrap',
      borderTop: 'var(--hairline) solid var(--border-hairline)',
      paddingTop: 'var(--space-lg)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Wordmark, {
    size: 18
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-body-md)',
      color: 'var(--text-muted)',
      marginLeft: 'auto'
    }
  }, legal))));
}
Object.assign(__ds_scope, { Footer });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Footer.jsx", error: String((e && e.message) || e) }); }

// components/navigation/TopNav.jsx
try { (() => {
function TopNav({
  items = [],
  active,
  onNavigate,
  compact = false,
  style
}) {
  const [open, setOpen] = React.useState(false);
  return /*#__PURE__*/React.createElement("header", {
    style: {
      height: 'var(--nav-height)',
      background: 'var(--surface-canvas)',
      borderBottom: 'var(--hairline) solid var(--border-hairline)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 var(--container-inset)',
      position: 'relative',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-xl)'
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      if (onNavigate) onNavigate(items[0] && items[0].id);
    },
    style: {
      display: 'flex',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Wordmark, {
    size: 22
  })), !compact ? /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-lg)'
    }
  }, items.map(it => /*#__PURE__*/React.createElement("button", {
    key: it.id,
    onClick: () => onNavigate && onNavigate(it.id),
    style: {
      font: 'var(--text-body-md)',
      background: 'transparent',
      border: 0,
      padding: 0,
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-xxs)',
      color: active === it.id ? 'var(--text-strong)' : 'var(--text-body)',
      fontWeight: active === it.id ? 'var(--weight-medium)' : 'var(--weight-regular)'
    }
  }, it.label, it.menu ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-down",
    size: 14
  }) : null))) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: 'auto',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-md)'
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      font: 'var(--text-body-md)',
      color: 'var(--text-body)'
    }
  }, "Book demo"), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    size: "sm"
  }, "Sign up for free"), /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      font: 'var(--text-body-md)',
      color: 'var(--text-body)'
    }
  }, "Log in"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setOpen(!open),
    "aria-label": "Menu",
    style: {
      display: 'none',
      background: 'transparent',
      border: 0,
      cursor: 'pointer',
      color: 'var(--text-strong)'
    },
    "data-nav-toggle": true
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "menu",
    size: 24
  })))));
}
Object.assign(__ds_scope, { TopNav });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/TopNav.jsx", error: String((e && e.message) || e) }); }

// components/navigation/TopicFilterRail.jsx
try { (() => {
function TopicFilterRail({
  groups = [],
  active,
  onSelect,
  style
}) {
  return /*#__PURE__*/React.createElement("aside", {
    style: {
      width: 'var(--rail-width)',
      flex: '0 0 var(--rail-width)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-lg)',
      ...style
    }
  }, groups.map((g, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-xs)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-label-md)',
      color: 'var(--text-strong)'
    }
  }, g.title), (g.items || []).map(it => {
    const id = it.id || it.label;
    const on = active === id;
    return /*#__PURE__*/React.createElement("button", {
      key: id,
      onClick: () => onSelect && onSelect(id),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-xs)',
        background: 'transparent',
        border: 0,
        padding: '2px 0',
        cursor: 'pointer',
        textAlign: 'left',
        font: 'var(--text-body-md)',
        fontWeight: on ? 'var(--weight-medium)' : 'var(--weight-regular)',
        color: on ? 'var(--text-strong)' : 'var(--text-body)'
      }
    }, it.label, it.count != null ? /*#__PURE__*/React.createElement("span", {
      style: {
        marginLeft: 'auto',
        font: 'var(--text-body-md)',
        color: 'var(--text-muted)',
        background: 'var(--surface-soft)',
        borderRadius: 'var(--radius-sm)',
        padding: '0 6px'
      }
    }, it.count) : null);
  }))));
}
Object.assign(__ds_scope, { TopicFilterRail });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/TopicFilterRail.jsx", error: String((e && e.message) || e) }); }

// components/pricing/PricingComparisonRow.jsx
try { (() => {
function PricingComparisonRow({
  label,
  values = [],
  header = false,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'minmax(160px,2fr) repeat(' + values.length + ', minmax(80px,1fr))',
      alignItems: 'center',
      gap: 'var(--space-md)',
      padding: 'var(--space-sm) 0',
      borderBottom: 'var(--hairline) solid var(--border-hairline)',
      fontFamily: 'var(--font-pricing)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: header ? 'var(--text-pricing-card-title)' : 'var(--text-body-md)',
      color: header ? 'var(--text-pricing)' : 'var(--text-body)'
    }
  }, label), values.map((v, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      font: header ? 'var(--text-label-md)' : 'var(--text-body-md)',
      color: header ? 'var(--text-pricing)' : 'var(--text-body)',
      textAlign: 'center'
    }
  }, v === true ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: 16,
    style: {
      color: 'var(--status-success)'
    }
  }) : v === false ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--border-strong)'
    }
  }, "\u2014") : v)));
}
Object.assign(__ds_scope, { PricingComparisonRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/pricing/PricingComparisonRow.jsx", error: String((e && e.message) || e) }); }

// components/pricing/PricingTierCard.jsx
try { (() => {
function PricingTierCard({
  name,
  price,
  cadence,
  blurb,
  features = [],
  cta = 'Get started',
  featured = false,
  style,
  onSelect
}) {
  return /*#__PURE__*/React.createElement("article", {
    style: {
      background: featured ? 'var(--surface-soft)' : 'var(--surface-canvas)',
      color: 'var(--text-pricing)',
      borderRadius: 'var(--radius-card)',
      padding: 'var(--pad-feature-card)',
      boxShadow: 'inset 0 0 0 var(--hairline) var(--border-hairline)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-md)',
      fontFamily: 'var(--font-pricing)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      font: 'var(--text-pricing-card-title)',
      color: 'var(--text-pricing)'
    }
  }, name), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 'var(--space-xs)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-pricing-display)',
      color: 'var(--text-pricing)'
    }
  }, price), cadence ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-body-md)',
      color: 'var(--text-muted)'
    }
  }, cadence) : null), blurb ? /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--text-body-md)',
      color: 'var(--text-body)'
    }
  }, blurb) : null, /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "pricingPill",
    onClick: onSelect,
    style: {
      alignSelf: 'stretch'
    }
  }, cta), /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: 'none',
      margin: 0,
      padding: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-xs)'
    }
  }, features.map((ft, i) => /*#__PURE__*/React.createElement("li", {
    key: i,
    style: {
      display: 'flex',
      gap: 'var(--space-xs)',
      font: 'var(--text-body-md)',
      color: 'var(--text-body)',
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: 16,
    style: {
      color: 'var(--status-success)',
      marginTop: 1
    }
  }), /*#__PURE__*/React.createElement("span", null, ft)))));
}
Object.assign(__ds_scope, { PricingTierCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/pricing/PricingTierCard.jsx", error: String((e && e.message) || e) }); }

// components/signature/RainbowStripeHero.jsx
try { (() => {
const DEFAULT_STRIPES = [{
  color: 'var(--coral)',
  width: 90
}, {
  color: 'var(--mustard)',
  width: 40
}, {
  color: 'var(--forest)',
  width: 120
}, {
  color: 'var(--peach)',
  width: 56
}, {
  color: 'var(--mint)',
  width: 32
}, {
  color: 'var(--yellow)',
  width: 72
}];
function RainbowStripeHero({
  title,
  subtitle,
  action,
  stripes = DEFAULT_STRIPES,
  style
}) {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      position: 'relative',
      background: 'var(--surface-dark-elevated)',
      color: 'var(--text-on-dark)',
      overflow: 'hidden',
      padding: 'var(--pad-band) var(--container-inset)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 0
    },
    "aria-hidden": "true"
  }, stripes.map((s, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      width: s.width,
      background: s.color,
      height: '100%'
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      maxWidth: 'var(--container-max)',
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: '32em',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-lg)',
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      font: 'var(--text-display-xl)',
      fontVariationSettings: 'var(--font-display-settings)',
      color: 'inherit'
    }
  }, title), subtitle ? /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--text-body-md)',
      color: 'inherit'
    }
  }, subtitle) : null, action)));
}
Object.assign(__ds_scope, { RainbowStripeHero });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/signature/RainbowStripeHero.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/ArticleCard.jsx
try { (() => {
function ArticleCard({
  category,
  title,
  meta,
  media,
  href = '#',
  style
}) {
  return /*#__PURE__*/React.createElement("a", {
    href,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-sm)',
      background: 'var(--surface-canvas)',
      borderRadius: 'var(--radius-card)',
      padding: 'var(--pad-demo-card)',
      boxShadow: 'inset 0 0 0 var(--hairline) var(--border-hairline)',
      textDecoration: 'none',
      color: 'var(--text-strong)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      aspectRatio: '16 / 9',
      borderRadius: 'var(--radius-card)',
      overflow: 'hidden',
      background: 'var(--surface-soft)'
    }
  }, media), category ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-caption)',
      letterSpacing: 'var(--track-caption)',
      textTransform: 'uppercase',
      color: 'var(--text-muted)'
    }
  }, category) : null, /*#__PURE__*/React.createElement("h4", {
    style: {
      font: 'var(--text-title-sm)',
      color: 'inherit'
    }
  }, title), meta ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-body-md)',
      color: 'var(--text-muted)'
    }
  }, meta) : null);
}
Object.assign(__ds_scope, { ArticleCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/ArticleCard.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/CalloutCard.jsx
try { (() => {
function CalloutCard({
  title,
  body,
  action,
  media,
  style,
  children
}) {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: 'var(--surface-callout-cream)',
      color: 'var(--text-strong)',
      borderRadius: 'var(--radius-card)',
      padding: 'var(--pad-callout)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-md)',
      alignItems: 'flex-start',
      ...style
    }
  }, title ? /*#__PURE__*/React.createElement("h3", {
    style: {
      font: 'var(--text-title-lg)',
      letterSpacing: 'var(--track-title)',
      color: 'inherit'
    }
  }, title) : null, body ? /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--text-body-md)',
      color: 'var(--text-body)'
    }
  }, body) : null, media, children, action);
}
Object.assign(__ds_scope, { CalloutCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/CalloutCard.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/CtaBand.jsx
try { (() => {
function CtaBand({
  tone = 'light',
  title,
  body,
  action,
  style
}) {
  const dark = tone === 'dark';
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: dark ? 'var(--surface-dark)' : 'var(--surface-strong)',
      color: dark ? 'var(--text-on-dark)' : 'var(--text-strong)',
      borderRadius: 'var(--radius-signature-card)',
      padding: 'var(--space-xxl)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: 'var(--space-lg)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      font: 'var(--text-display-md)',
      fontVariationSettings: 'var(--font-display-settings)',
      color: 'inherit',
      maxWidth: '24em'
    }
  }, title), body ? /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--text-body-md)',
      color: 'inherit',
      maxWidth: '44em'
    }
  }, body) : null, action);
}
Object.assign(__ds_scope, { CtaBand });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/CtaBand.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/DemoGridCard.jsx
try { (() => {
const demoSurfaces = {
  canvas: 'var(--surface-canvas)',
  peach: 'var(--surface-demo-peach)',
  mint: 'var(--surface-demo-mint)',
  yellow: 'var(--surface-demo-yellow)',
  mustard: 'var(--surface-demo-mustard)',
  cream: 'var(--surface-callout-cream)'
};
function DemoGridCard({
  surface = 'canvas',
  title,
  caption,
  height,
  media,
  style,
  children
}) {
  return /*#__PURE__*/React.createElement("article", {
    style: {
      background: demoSurfaces[surface] || demoSurfaces.canvas,
      color: 'var(--text-strong)',
      borderRadius: 'var(--radius-card)',
      padding: 'var(--pad-demo-card)',
      boxShadow: surface === 'canvas' ? 'inset 0 0 0 var(--hairline) var(--border-hairline)' : 'none',
      minHeight: height,
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-sm)',
      ...style
    }
  }, title ? /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-label-md)',
      color: 'inherit'
    }
  }, title) : null, caption ? /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--text-body-md)',
      color: 'var(--text-body)'
    }
  }, caption) : null, media, children);
}
Object.assign(__ds_scope, { DemoGridCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/DemoGridCard.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/FeatureCardTabbed.jsx
try { (() => {
function FeatureCardTabbed({
  tabs = [],
  value,
  onChange,
  style
}) {
  const [internal, setInternal] = React.useState(0);
  const active = value != null ? value : internal;
  const select = i => {
    if (onChange) onChange(i);else setInternal(i);
  };
  const current = tabs[active] || {};
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: 'var(--surface-soft)',
      borderRadius: 'var(--radius-signature-card)',
      padding: 'var(--pad-feature-card)',
      display: 'grid',
      gridTemplateColumns: 'minmax(180px,0.8fr) minmax(0,2fr)',
      gap: 'var(--space-xl)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-sm)'
    }
  }, tabs.map((t, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: () => select(i),
    style: {
      font: 'var(--text-title-md)',
      fontVariationSettings: 'var(--font-display-settings)',
      textAlign: 'left',
      background: 'transparent',
      border: 0,
      borderLeft: '2px solid ' + (i === active ? 'var(--text-strong)' : 'transparent'),
      paddingLeft: 'var(--space-md)',
      color: i === active ? 'var(--text-strong)' : 'var(--text-muted)',
      cursor: 'pointer',
      transition: 'color var(--dur-fast) var(--ease-standard)'
    }
  }, t.label))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-md)',
      alignItems: 'flex-start'
    }
  }, current.media, current.title ? /*#__PURE__*/React.createElement("h3", {
    style: {
      font: 'var(--text-title-lg)',
      letterSpacing: 'var(--track-title)'
    }
  }, current.title) : null, current.body ? /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--text-body-md)',
      color: 'var(--text-body)'
    }
  }, current.body) : null, current.action));
}
Object.assign(__ds_scope, { FeatureCardTabbed });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/FeatureCardTabbed.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/HeroBand.jsx
try { (() => {
function HeroBand({
  eyebrow,
  title,
  subtitle,
  actions,
  note,
  align = 'left',
  media,
  style
}) {
  const centered = align === 'center';
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: 'var(--surface-canvas)',
      padding: 'var(--pad-band) 0',
      display: 'grid',
      gridTemplateColumns: media ? 'minmax(0,1fr) minmax(0,1fr)' : 'minmax(0,1fr)',
      gap: 'var(--space-xxl)',
      alignItems: 'center',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-lg)',
      alignItems: centered ? 'center' : 'flex-start',
      textAlign: centered ? 'center' : 'left',
      maxWidth: centered ? '46em' : 'none',
      margin: centered ? '0 auto' : 0
    }
  }, eyebrow ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-caption)',
      letterSpacing: 'var(--track-caption)',
      textTransform: 'uppercase',
      color: 'var(--text-muted)'
    }
  }, eyebrow) : null, /*#__PURE__*/React.createElement("h1", {
    style: {
      font: 'var(--text-display-lg)',
      fontVariationSettings: 'var(--font-display-settings)',
      maxWidth: '20em'
    }
  }, title), subtitle ? /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--text-body-md)',
      color: 'var(--text-body)',
      maxWidth: '44em'
    }
  }, subtitle) : null, actions ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-sm)',
      flexWrap: 'wrap'
    }
  }, actions) : null, note ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-body-md)',
      color: 'var(--text-muted)'
    }
  }, note) : null), media);
}
Object.assign(__ds_scope, { HeroBand });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/HeroBand.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/LogoStrip.jsx
try { (() => {
function LogoStrip({
  names = [],
  label,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-canvas)',
      padding: 'var(--space-xl) 0',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-md)',
      alignItems: 'center',
      ...style
    }
  }, label ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-caption)',
      letterSpacing: 'var(--track-caption)',
      color: 'var(--text-muted)'
    }
  }, label) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-xl)',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center'
    }
  }, names.map((n, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      font: 'var(--text-label-md)',
      color: 'var(--text-muted)',
      letterSpacing: '0.02em'
    }
  }, n))));
}
Object.assign(__ds_scope, { LogoStrip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/LogoStrip.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/MediaPlaceholder.jsx
try { (() => {
function MediaPlaceholder({
  label = 'Product UI',
  ratio = '16 / 10',
  radius = 'var(--radius-card)',
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      aspectRatio: ratio,
      width: '100%',
      borderRadius: radius,
      background: 'var(--surface-soft)',
      border: 'var(--hairline) dashed var(--border-hairline)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-muted)',
      font: 'var(--text-caption)',
      letterSpacing: 'var(--track-caption)',
      ...style
    }
  }, label);
}
Object.assign(__ds_scope, { MediaPlaceholder });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/MediaPlaceholder.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/SignatureCard.jsx
try { (() => {
const signatureTones = {
  coral: {
    background: 'var(--surface-signature-coral)',
    color: 'var(--text-on-dark)'
  },
  forest: {
    background: 'var(--surface-signature-forest)',
    color: 'var(--text-on-dark)'
  },
  dark: {
    background: 'var(--surface-dark)',
    color: 'var(--text-on-dark)'
  }
};
function SignatureCard({
  tone = 'coral',
  eyebrow,
  title,
  body,
  action,
  media,
  style,
  children
}) {
  const t = signatureTones[tone] || signatureTones.coral;
  return /*#__PURE__*/React.createElement("section", {
    style: {
      ...t,
      borderRadius: 'var(--radius-signature-card)',
      padding: 'var(--pad-signature-card)',
      display: 'grid',
      gridTemplateColumns: media ? 'minmax(0,1fr) minmax(0,1fr)' : 'minmax(0,1fr)',
      gap: 'var(--space-xxl)',
      alignItems: 'center',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-lg)',
      alignItems: 'flex-start'
    }
  }, eyebrow ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-caption)',
      letterSpacing: 'var(--track-caption)',
      textTransform: 'uppercase',
      opacity: 0.85
    }
  }, eyebrow) : null, title ? /*#__PURE__*/React.createElement("h2", {
    style: {
      font: 'var(--text-display-md)',
      fontVariationSettings: 'var(--font-display-settings)',
      color: 'inherit',
      maxWidth: '18em'
    }
  }, title) : null, body ? /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--text-body-md)',
      color: 'inherit',
      maxWidth: '42em'
    }
  }, body) : null, children, action), media);
}
Object.assign(__ds_scope, { SignatureCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/SignatureCard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing-site/Articles.jsx
try { (() => {
const {
  Band,
  CardGrid,
  RainbowStripeHero,
  TopicFilterRail,
  ArticleCard,
  MediaPlaceholder,
  TextInput,
  Icon,
  Button,
  IconButton
} = window.AirtableMarketingDesignSystem_58d612;
const GROUPS = [{
  title: 'Marketing',
  items: [{
    label: 'Campaigns',
    count: 12
  }, {
    label: 'Content operations',
    count: 8
  }, {
    label: 'Brand'
  }]
}, {
  title: 'Product',
  items: [{
    label: 'Roadmapping',
    count: 6
  }, {
    label: 'Research'
  }, {
    label: 'Launches'
  }]
}, {
  title: 'Project management',
  items: [{
    label: 'Planning',
    count: 9
  }, {
    label: 'Resourcing'
  }]
}, {
  title: 'Operations',
  items: [{
    label: 'Inventory'
  }, {
    label: 'Vendors',
    count: 4
  }, {
    label: 'Finance ops'
  }]
}];
const STORIES = [{
  category: 'Product',
  topic: 'Roadmapping',
  title: 'How to scope an internal tool in a week',
  meta: 'Sept 2 &middot; 6 min read'
}, {
  category: 'Operations',
  topic: 'Inventory',
  title: 'Retiring the spreadsheet of record',
  meta: 'Aug 28 &middot; 4 min read'
}, {
  category: 'Marketing',
  topic: 'Campaigns',
  title: 'A campaign calendar your team will actually use',
  meta: 'Aug 21 &middot; 8 min read'
}, {
  category: 'Project management',
  topic: 'Planning',
  title: 'Dependencies that update themselves',
  meta: 'Aug 14 &middot; 5 min read'
}, {
  category: 'Marketing',
  topic: 'Content operations',
  title: 'One brief, every channel',
  meta: 'Aug 7 &middot; 7 min read'
}, {
  category: 'Operations',
  topic: 'Vendors',
  title: 'Vendor reviews without the email thread',
  meta: 'Jul 30 &middot; 5 min read'
}];
function Articles() {
  const [topic, setTopic] = React.useState(null);
  const [query, setQuery] = React.useState('');
  const shown = STORIES.filter(s => (!topic || s.topic === topic) && (!query || s.title.toLowerCase().includes(query.toLowerCase())));
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(RainbowStripeHero, {
    title: "Stories from teams who build their own tools",
    subtitle: "Interviews, teardowns, and templates from the people running operations, marketing, and product on Airtable.",
    action: /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      onClick: () => {
        setTopic(null);
        setQuery('');
      }
    }, "Browse all articles")
  }), /*#__PURE__*/React.createElement(Band, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-xxl)',
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement(TopicFilterRail, {
    groups: GROUPS,
    active: topic,
    onSelect: id => setTopic(id === topic ? null : id)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-lg)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-md)'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      marginRight: 'auto'
    }
  }, topic || 'Trending stories'), /*#__PURE__*/React.createElement(TextInput, {
    placeholder: "Search articles",
    value: query,
    onChange: e => setQuery(e.target.value),
    iconBefore: /*#__PURE__*/React.createElement(Icon, {
      name: "search",
      size: 16
    }),
    style: {
      width: 260
    }
  }), /*#__PURE__*/React.createElement(IconButton, {
    label: "Previous page"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-left",
    size: 18
  })), /*#__PURE__*/React.createElement(IconButton, {
    label: "Next page"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-right",
    size: 18
  }))), shown.length ? /*#__PURE__*/React.createElement(CardGrid, {
    columns: 3
  }, shown.map(s => /*#__PURE__*/React.createElement(ArticleCard, {
    key: s.title,
    category: s.category,
    title: s.title,
    meta: /*#__PURE__*/React.createElement("span", {
      dangerouslySetInnerHTML: {
        __html: s.meta
      }
    }),
    media: /*#__PURE__*/React.createElement(MediaPlaceholder, {
      label: "Illustration",
      ratio: "16 / 9",
      style: {
        border: 0
      }
    })
  }))) : /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--text-body-md)',
      color: 'var(--text-muted)'
    }
  }, "No stories match that filter yet.")))));
}
Object.assign(window, {
  Articles
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing-site/Articles.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing-site/Home.jsx
try { (() => {
const {
  Band,
  CardGrid,
  HeroBand,
  SignatureCard,
  CalloutCard,
  FeatureCardTabbed,
  DemoGridCard,
  CtaBand,
  LogoStrip,
  MediaPlaceholder,
  Button,
  Icon
} = window.AirtableMarketingDesignSystem_58d612;
const DEMO_CARDS = [{
  surface: 'peach',
  title: 'Interface Designer',
  caption: 'Give every team a view built for the work they do.',
  height: 300
}, {
  surface: 'mint',
  title: 'Automations',
  caption: 'Trigger the next step the moment a record changes.',
  height: 240
}, {
  surface: 'yellow',
  title: 'Sync',
  caption: 'Two-way sync with the systems you already run on.',
  height: 280
}, {
  surface: 'canvas',
  title: 'Reporting',
  caption: 'Dashboards that read from the same records your team edits.',
  height: 220
}, {
  surface: 'mustard',
  title: 'Cobuilder',
  caption: 'Describe the app you need and start from a working draft.',
  height: 260
}, {
  surface: 'cream',
  title: 'Enterprise Hub',
  caption: 'Governance, permissions, and audit in one console.',
  height: 230
}];
const STORY_TABS = [{
  label: 'Marketing',
  title: 'Campaign operations in a single base',
  body: 'Briefs, assets, approvals, and launch dates in one place, so nobody has to ask where a campaign stands.',
  media: /*#__PURE__*/React.createElement(MediaPlaceholder, {
    label: "Campaign calendar",
    ratio: "16 / 8"
  })
}, {
  label: 'Product',
  title: 'Roadmaps that stay current',
  body: 'Specs, research, and shipping status linked to the same records, updated by the teams who own them.',
  media: /*#__PURE__*/React.createElement(MediaPlaceholder, {
    label: "Roadmap grid",
    ratio: "16 / 8"
  })
}, {
  label: 'Operations',
  title: 'Inventory without the spreadsheet of record',
  body: 'One record per item, visible in every view that needs it, with automations handling the reordering.',
  media: /*#__PURE__*/React.createElement(MediaPlaceholder, {
    label: "Inventory table",
    ratio: "16 / 8"
  })
}, {
  label: 'Project management',
  title: 'Every project in one plan',
  body: 'Timelines, owners, and dependencies that update themselves as the work moves.',
  media: /*#__PURE__*/React.createElement(MediaPlaceholder, {
    label: "Timeline view",
    ratio: "16 / 8"
  })
}];
function Home({
  onNavigate
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Band, {
    pad: "none"
  }, /*#__PURE__*/React.createElement(HeroBand, {
    title: "Build apps that move your business forward",
    subtitle: "Airtable brings your data, your workflows, and your teams into one place \u2014 then lets you build the app around them.",
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      onClick: () => onNavigate('pricing')
    }, "Sign up for free"), /*#__PURE__*/React.createElement(Button, {
      variant: "secondary"
    }, "Book demo")),
    note: "No credit card required",
    media: /*#__PURE__*/React.createElement(MediaPlaceholder, {
      label: "Product overview",
      ratio: "16 / 11"
    })
  })), /*#__PURE__*/React.createElement(Band, {
    surface: "soft",
    pad: "sm"
  }, /*#__PURE__*/React.createElement(LogoStrip, {
    label: "Trusted by teams at",
    names: ['HBO', 'Netflix', 'Amazon', 'Time', 'Conde Nast', 'Shopify']
  })), /*#__PURE__*/React.createElement(Band, null, /*#__PURE__*/React.createElement(SignatureCard, {
    tone: "coral",
    eyebrow: "Platform",
    title: "Production apps in prototype speed",
    body: "Start from your data, lay out the interface your team actually needs, and ship it the same week. No procurement cycle, no six-month build.",
    action: /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      iconAfter: /*#__PURE__*/React.createElement(Icon, {
        name: "arrow-right",
        size: 18
      })
    }, "Get started for free"),
    media: /*#__PURE__*/React.createElement(MediaPlaceholder, {
      label: "Interface Designer",
      ratio: "4 / 3"
    })
  })), /*#__PURE__*/React.createElement(Band, {
    pad: "section"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-xl)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-md)',
      maxWidth: '40em'
    }
  }, /*#__PURE__*/React.createElement("h2", null, "Everything your team runs on, in one system"), /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--text-body-md)',
      color: 'var(--text-body)'
    }
  }, "Each piece works on its own and better together. Pick the ones your workflow needs today and add the rest when it grows.")), /*#__PURE__*/React.createElement(CardGrid, {
    columns: 3
  }, DEMO_CARDS.map(c => /*#__PURE__*/React.createElement(DemoGridCard, {
    key: c.title,
    surface: c.surface,
    title: c.title,
    caption: c.caption,
    height: c.height,
    media: /*#__PURE__*/React.createElement(MediaPlaceholder, {
      label: c.title,
      ratio: "4 / 3",
      style: {
        marginTop: 'auto'
      }
    })
  }))))), /*#__PURE__*/React.createElement(Band, {
    surface: "cream"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))',
      gap: 'var(--gutter-grid)'
    }
  }, /*#__PURE__*/React.createElement(CalloutCard, {
    style: {
      background: 'transparent',
      padding: 0
    },
    title: "The path to 10x every person in your organization",
    body: "Teams that build their own tools stop waiting on a backlog. The work moves at the speed of the people closest to it.",
    action: /*#__PURE__*/React.createElement(Button, null, "Read the report")
  }), /*#__PURE__*/React.createElement(CalloutCard, {
    title: "46% less time in status meetings",
    body: "Reported across 200 operations teams in the 2026 customer survey."
  }), /*#__PURE__*/React.createElement(CalloutCard, {
    title: "3 weeks to first production app",
    body: "Median time from first base to a tool the whole team relies on."
  }))), /*#__PURE__*/React.createElement(Band, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-xl)'
    }
  }, /*#__PURE__*/React.createElement("h2", null, "How teams use it"), /*#__PURE__*/React.createElement(FeatureCardTabbed, {
    tabs: STORY_TABS
  }))), /*#__PURE__*/React.createElement(Band, {
    surface: "soft"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))',
      gap: 'var(--gutter-grid)',
      alignItems: 'stretch'
    }
  }, /*#__PURE__*/React.createElement(SignatureCard, {
    tone: "forest",
    title: "Every team, one source of truth",
    body: "Connected records mean one update lands everywhere it matters.",
    action: /*#__PURE__*/React.createElement(Button, {
      variant: "secondary"
    }, "See how sync works")
  }), /*#__PURE__*/React.createElement(SignatureCard, {
    tone: "dark",
    title: "Governance the way IT wants it",
    body: "Permissions, audit logs, and provisioning built for organization-wide rollout.",
    action: /*#__PURE__*/React.createElement(Button, {
      variant: "secondary"
    }, "Explore Enterprise")
  }))), /*#__PURE__*/React.createElement(Band, {
    pad: "lg"
  }, /*#__PURE__*/React.createElement(CtaBand, {
    title: "Start building with Airtable",
    body: "Free to start. Bring your team when you are ready.",
    action: /*#__PURE__*/React.createElement(Button, {
      onClick: () => onNavigate('pricing')
    }, "Sign up for free")
  })));
}
Object.assign(window, {
  Home
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing-site/Home.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing-site/Pricing.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (let e = 1; e < arguments.length; e++) { const t = arguments[e]; for (const r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  Band,
  CardGrid,
  PricingTierCard,
  PricingComparisonRow,
  Button,
  CtaBand
} = window.AirtableMarketingDesignSystem_58d612;
const TIERS = [{
  name: 'Free',
  price: '$0',
  blurb: 'For individuals and small teams getting started.',
  cta: 'Sign up for free',
  features: ['Unlimited bases', '1,000 records per base', '1 GB attachments', 'Interface Designer (read-only)']
}, {
  name: 'Team',
  price: '$20',
  cadence: 'per seat / month',
  featured: true,
  blurb: 'For teams building and running shared workflows.',
  features: ['50,000 records per base', '20 GB attachments', 'Interface Designer', 'Standard sync integrations', '25,000 automation runs']
}, {
  name: 'Business',
  price: '$45',
  cadence: 'per seat / month',
  blurb: 'For scaled workflows and multiple departments.',
  features: ['125,000 records per base', '100 GB attachments', 'Admin panel', 'SAML single sign-on', '100,000 automation runs']
}, {
  name: 'Enterprise',
  price: 'Custom',
  blurb: 'For organization-wide deployment.',
  cta: 'Contact sales',
  features: ['500,000 records per base', '1 TB attachments', 'Enterprise Hub', 'Audit logs and DLP', 'Custom automation limits']
}];
const ROWS = [{
  label: 'Records per base',
  values: ['1,000', '50,000', '125,000', '500,000']
}, {
  label: 'Attachment space',
  values: ['1 GB', '20 GB', '100 GB', '1 TB']
}, {
  label: 'Automation runs / month',
  values: ['100', '25,000', '100,000', 'Custom']
}, {
  label: 'Interface Designer',
  values: [false, true, true, true]
}, {
  label: 'Standard sync integrations',
  values: [false, true, true, true]
}, {
  label: 'Admin panel',
  values: [false, false, true, true]
}, {
  label: 'SAML single sign-on',
  values: [false, false, true, true]
}, {
  label: 'Enterprise Hub',
  values: [false, false, false, true]
}, {
  label: 'Audit logs',
  values: [false, false, false, true]
}, {
  label: 'Support',
  values: ['Community', 'Email', 'Priority', 'Dedicated CSM']
}];
function Pricing() {
  const [annual, setAnnual] = React.useState(true);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Band, {
    pad: "lg"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-lg)',
      alignItems: 'center',
      textAlign: 'center',
      fontFamily: 'var(--font-pricing)'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      font: 'var(--text-pricing-display)',
      color: 'var(--text-pricing)',
      maxWidth: '20em'
    }
  }, "Plans that scale with how much you build"), /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--text-body-md)',
      color: 'var(--text-body)',
      maxWidth: '38em'
    }
  }, "Start free, add seats as your team grows, and move to Enterprise when governance becomes the requirement."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      padding: 4,
      background: 'var(--surface-soft)',
      borderRadius: 'var(--radius-pill)',
      gap: 4
    }
  }, [['Annual', true], ['Monthly', false]].map(([label, val]) => /*#__PURE__*/React.createElement("button", {
    key: label,
    onClick: () => setAnnual(val),
    style: {
      font: 'var(--text-button)',
      fontFamily: 'var(--font-pricing)',
      border: 0,
      cursor: 'pointer',
      padding: '12px 24px',
      borderRadius: 'var(--radius-pill)',
      background: annual === val ? 'var(--surface-canvas)' : 'transparent',
      color: annual === val ? 'var(--text-pricing)' : 'var(--text-muted)',
      boxShadow: annual === val ? 'inset 0 0 0 1px var(--border-hairline)' : 'none'
    }
  }, label))))), /*#__PURE__*/React.createElement(Band, {
    pad: "none",
    style: {
      paddingBottom: 'var(--space-section)'
    }
  }, /*#__PURE__*/React.createElement(CardGrid, {
    columns: 4,
    dense: true
  }, TIERS.map(t => {
    const monthly = t.price.startsWith('$') && t.price !== '$0';
    const price = monthly && !annual ? '$' + Math.round(parseInt(t.price.slice(1), 10) * 1.25) : t.price;
    return /*#__PURE__*/React.createElement(PricingTierCard, _extends({
      key: t.name
    }, t, {
      price
    }));
  }))), /*#__PURE__*/React.createElement(Band, {
    surface: "soft"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-lg)'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      font: 'var(--text-pricing-section)',
      fontFamily: 'var(--font-pricing)',
      color: 'var(--text-pricing)'
    }
  }, "Compare plans"), /*#__PURE__*/React.createElement("div", {
    style: {
      overflowX: 'auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 720
    }
  }, /*#__PURE__*/React.createElement(PricingComparisonRow, {
    header: true,
    label: "Features",
    values: TIERS.map(t => t.name)
  }), ROWS.map(r => /*#__PURE__*/React.createElement(PricingComparisonRow, _extends({
    key: r.label
  }, r))))))), /*#__PURE__*/React.createElement(Band, {
    pad: "lg"
  }, /*#__PURE__*/React.createElement(CtaBand, {
    tone: "dark",
    title: "Not sure which plan fits?",
    body: "Tell us how your team works and we will map it to a plan.",
    action: /*#__PURE__*/React.createElement(Button, {
      variant: "secondary"
    }, "Book demo")
  })));
}
Object.assign(window, {
  Pricing
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing-site/Pricing.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing-site/Shell.jsx
try { (() => {
const {
  TopNav,
  Footer
} = window.AirtableMarketingDesignSystem_58d612;
const NAV_ITEMS = [{
  id: 'home',
  label: 'Platform',
  menu: true
}, {
  id: 'solutions',
  label: 'Solutions',
  menu: true
}, {
  id: 'articles',
  label: 'Resources',
  menu: true
}, {
  id: 'enterprise',
  label: 'Enterprise'
}, {
  id: 'pricing',
  label: 'Pricing'
}];
const FOOTER_COLUMNS = [{
  title: 'Platform',
  links: ['Interface Designer', 'Automations', 'Sync', 'AI', 'Integrations']
}, {
  title: 'Solutions',
  links: ['Marketing', 'Product', 'Operations', 'Project management']
}, {
  title: 'Resources',
  links: ['Articles', 'Templates', 'Webinars', 'Events']
}, {
  title: 'Learn',
  links: ['Guides', 'Support', 'Community', 'Developers']
}, {
  title: 'Company',
  links: ['About', 'Careers', 'Newsroom', 'Partners']
}, {
  title: 'Legal',
  links: ['Privacy', 'Terms', 'Security', 'Cookie preferences']
}];
function Shell({
  page,
  onNavigate,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-canvas)',
      minHeight: '100%'
    }
  }, /*#__PURE__*/React.createElement(TopNav, {
    items: NAV_ITEMS,
    active: page,
    onNavigate
  }), /*#__PURE__*/React.createElement("main", null, children), /*#__PURE__*/React.createElement(Footer, {
    columns: FOOTER_COLUMNS,
    legal: "\xA9 2026 Airtable. All rights reserved."
  }));
}
Object.assign(window, {
  Shell,
  NAV_ITEMS,
  FOOTER_COLUMNS
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing-site/Shell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing-site/doc-page.js
try { (() => {
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)
// Copied omelette starter. Re-running copy_starter_component with this kind overwrites this file with the latest version (page content is unaffected).
/* BEGIN USAGE */
/**
 * <doc-page> — paged-document shell for printable HTML.
 *
 * FIRST, decide how the document paginates — up front, before building:
 *
 * - FLOWING document (the default): write the whole document as one
 *   normal HTML flow inside <doc-page>; the browser's print engine
 *   splits it onto pages at export. Use for long-form documents with a
 *   single text flow: reports, memos, letters, essays.
 * - EXPLICIT pagination: a fixed set of pre-paginated pages, one
 *   <section class="page"> child per page. Use when the user asks for a
 *   specific page count, or the design implies one: a one-page resume, a
 *   two-sided flier, a poster, a certificate, a brochure — any richly
 *   laid-out document without a single text flow.
 * - If in doubt, ask the user as part of the build.
 *
 * PAGE SIZING — paper differs by country (letter vs A4), so the printed
 * sheet is not one fixed truth:
 * - FLOWING documents pin NO paper size: the print engine paginates
 *   onto the user's real paper, and the content reflows to it.
 * - EXPLICITLY PAGINATED documents print each page at a FIXED page box
 *   with overflow hidden — letter by default, size="a4" for a clearly
 *   metric user, the user's chosen paper when they export. Design each
 *   page to FILL that box, fitting letter and A4 alike without overlap.
 * - width/height pin an explicit fixed size, ONLY when the user gives
 *   one.
 * Never write your own @page rule or hard-code paper dimensions in the
 * content.
 *
 * Sizing modes (attributes):
 *   (none)                      — portrait: flowing docs use the user's
 *           paper; explicitly paginated pages use the named size box
 *           (letter unless size="a4")
 *   orientation="landscape"     — the same, landscape
 *   width / height              — explicit fixed size, ONLY when the user
 *           gives one (e.g. width="22in" height="30in" for a 22×30
 *           poster): the page IS the design's size, printed at true
 *           dimensions (or scaled onto the user's paper at print time).
 *           Any absolute CSS length: px/in/mm/cm/pt/pc.
 * The component announces the chosen mode to the host app at runtime (a
 * meta tag it injects), so the print path can inject the user's true
 * paper size.
 *
 * On screen the document renders on a desk background: a flowing
 * document as one tall scrolling sheet (Google Docs' pageless view);
 * explicitly paginated documents as one card per page.
 *
 * EXPLICIT pagination usage:
 *   <style>doc-page:not(:defined){visibility:hidden}</style>
 *   <doc-page>
 *     <section class="page" id="p1">…one page's design…</section>
 *     <section class="page" id="p2">…</section>
 *   </doc-page>
 *   <script src="doc-page.js"></script>
 * How the page box works, concretely: each .page prints as ONE full-bleed
 * sheet at a FIXED physical size — letter by default (set size="a4" for
 * a clearly metric user), the user's chosen paper when they export —
 * with overflow hidden. Nothing scrolls and nothing reflows onto a next
 * sheet: content that misses the box is CLIPPED. Design each page to
 * FILL that page box, and to fit it — letter and A4 alike — without
 * overlap. Each page is a size container; don't size anything in
 * viewport units (they track the window, not the page), and never set
 * width or height on the .page section itself (the component sizes the
 * page box; an authored height like 100% is meaningless at print and is
 * overridden). The component owns the page box, the screen card chrome,
 * and the page breaks (never add your own break-before/after). Don't mix
 * .page sections with flowing content or header/footer slots in the same
 * document.
 *
 * FLOWING usage:
 *   <style>doc-page:not(:defined){visibility:hidden}</style>
 *   <doc-page margin="0.75in">
 *     <h1>Title</h1>
 *     <p>…body…</p>
 *   </doc-page>
 *   <script src="doc-page.js"></script>
 * There is no manual page-splitting — the browser's print engine
 * paginates at export. Standard break-hygiene rules (`break-inside:
 * avoid` on figures, code blocks, images and table rows; `orphans/
 * widows: 3`) are applied so paragraphs and groups split cleanly. On
 * screen and at print, headings default to `text-wrap: balance` and
 * body text to `text-wrap: pretty`; the defaults have zero specificity,
 * so any text-wrap you declare wins.
 *
 * Other attributes:
 *   size    — letter | a4 | legal (default letter). Flowing documents:
 *           preview proportion only — it does NOT pin their printed
 *           paper (the print dialog's paper governs); leave it alone
 *           there. Explicitly paginated documents: it sets the page box
 *           the cards and the pinned @page share (the export dialog's
 *           choice overrides both at print) — set size="a4" for a
 *           clearly metric user. Scaled-fit: names the sheet the fit is
 *           computed against, same a4-for-metric-users advice.
 *   content-width / content-height — the design's own fixed dimensions
 *           (CSS lengths), for scaling a fixed-size design ONTO the
 *           named sheet: content lays out at exactly this size, and the
 *           component scales it to fit that sheet's printable area
 *           (centered horizontally, top-aligned; the export dialog
 *           re-fits to the user's actual paper choice where available).
 *           Both must be set; they do not change the page box. For pages
 *           WITHOUT running header/footer slots.
 *   margin  — printable inset on every page of a FLOWING document
 *           (default 0.75in); margin="0" makes pages full-bleed.
 *           Explicitly paginated pages are always full-bleed.
 *
 * Running header/footer (flowing documents only): give an element
 * `slot="header"` or `slot="footer"` and it repeats on every printed
 * page via `position: fixed`. To keep body text from sliding under it,
 * the component prints inside a single-cell table whose <thead>/<tfoot>
 * are spacers sized to the header/footer height — browsers repeat
 * thead/tfoot on every page, so each sheet's content starts below the
 * header and ends above the footer. On screen the header/footer render
 * once at the top/bottom of the sheet.
 *
 * At print the component injects `@page { margin: 0 }` (which leaves
 * Chrome no margin box to draw its date/URL/page-count header in) and
 * moves the visual margin onto the sheet's own padding. It also marks
 * the document as owning its print CSS (a
 * `meta[name="omelette-owns-print"]` it injects at runtime), so the
 * PDF export never injects page-geometry CSS of its own on top.
 *
 * Print best practices for the content you author:
 * - Multi-column text: use CSS columns (`column-count` +
 *   `column-gap`), never side-by-side flex/grid columns — only real
 *   CSS columns flow and break across pages. `column-span: all` lets
 *   a heading span the columns; `hyphens: auto` (needs `lang` on
 *   the html element) keeps narrow columns readable.
 * - Page breaks in flowing documents: `break-before: page` on an
 *   element that must start a new page (a chapter, an appendix). Add
 *   your own kept-together blocks (callouts, stat tiles, cards) to a
 *   `break-inside: avoid` rule, and keep each one shorter than a page.
 * - Extend `orphans: 3; widows: 3` to any custom text blocks you add
 *   (p and li are covered by default).
 * - Give long tables a <thead> — browsers repeat it on every printed
 *   page.
 * - No `position: fixed`/`sticky` and no viewport units in content:
 *   fixed elements stamp every printed page (running headers/footers go
 *   in the component's slots) and `100vh` mis-sizes at print.
 *
 * Author content as static HTML so the user can click-to-edit any text
 * directly. Do not set width/padding/background on the document body —
 * the component owns the sheet box.
 */
/* END USAGE */

(() => {
  const PAPER = {
    letter: ['8.5in', '11in'],
    a4: ['210mm', '297mm'],
    legal: ['8.5in', '14in']
  };
  const CSS_LENGTH = /^\d+(\.\d+)?(px|in|mm|cm|pt|pc)$/;
  // Unitless "0" is a valid CSS length and the natural way to write
  // margin="0"; normalise it to 0px so max()/calc() (which reject a bare
  // number) keep working.
  const safeLen = (v, fb) => {
    v = (v || '').trim();
    return v === '0' ? '0px' : CSS_LENGTH.test(v) ? v : fb;
  };
  // WebKit (Safari and every iOS browser shell) never repeats a table's
  // thead/tfoot on printed pages (WebKit bug 17205), so the spacer-borne
  // vertical margins of a FLOWING document reach only the first page
  // there. Engine check, not browser check: vendor is 'Apple Computer,
  // Inc.' exactly for WebKit and 'Google Inc.' for Blink.
  const WK_PRINT = /apple/i.test(navigator.vendor || '');
  // CSS length → px number (CSS absolute units are exact: 1in = 96px).
  // Returns NaN for anything safeLen would reject — callers gate on it.
  const PX_PER = {
    px: 1,
    in: 96,
    mm: 96 / 25.4,
    cm: 96 / 2.54,
    pt: 96 / 72,
    pc: 16
  };
  const toPx = v => {
    const m = /^(\d+(?:\.\d+)?)(px|in|mm|cm|pt|pc)$/.exec((v || '').trim());
    return m ? parseFloat(m[1]) * PX_PER[m[2]] : NaN;
  };
  const stylesheet = `
    :host {
      position: relative;
      display: block;
      /* When the viewport is narrower than the page, grow to wrap the
       * sheet (plus this padding) instead of staying viewport-width, so
       * the desk background and right margin reach the sheet's far edge
       * in the horizontal scroll. */
      min-width: max-content;
      min-height: 100vh;
      background: #f5f5f4;
      padding: 48px 24px;
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
      --doc-page-w: 8.5in;
      --doc-page-h: 11in;
      --doc-page-margin: 0.75in;
      --doc-hdr-h: 0px;
      --doc-ftr-h: 0px;
      --doc-hdr-pad: 0px;
      --doc-ftr-pad: 0px;
    }
    .sheet {
      width: var(--doc-page-w);
      margin: 0 auto;
      background: #fff;
      box-shadow: 0 2px 10px rgba(20, 20, 19, 0.12);
      border-radius: 7px;
      box-sizing: border-box;
      padding: var(--doc-page-margin);
    }
    .frame { width: 100%; border-collapse: collapse; }
    /* Scaled-fit mode (content-width/content-height): the inner .fit box
     * lays the content out at its authored fixed size and scales it onto
     * the printable area; .fit-box reserves the scaled footprint in flow
     * (transforms don't affect layout) and centers it. Without the mode,
     * both divs are unstyled block pass-throughs. */
    /* Explicit pagination: direct .page children are the pages. The sheet
     * becomes a transparent stack and each page carries the card look on
     * screen; at print each page is exactly one full-bleed sheet. The
     * ::slotted defaults are deliberately weak (document CSS wins), so
     * authored page styling can override any of this. */
    .sheet.paginated {
      background: transparent;
      box-shadow: none;
      border-radius: 0;
      padding: 0;
    }
    .paginated ::slotted(.page) {
      position: relative;
      display: block;
      width: 100%;
      aspect-ratio: var(--doc-page-ar);
      container-type: size;
      overflow: hidden;
      box-sizing: border-box;
      background: #fff;
      border-radius: 7px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
      break-inside: avoid;
    }
    .paginated ::slotted(.page:not(:first-child)) { margin-top: 1rem; }
    @media print {
      .sheet.paginated { padding: 0; }
      /* The flowing-document vertical inset lives on the repeating
       * thead/tfoot spacers, not the sheet padding — they must go too,
       * or each full-sheet .page is pushed ~margin down and spills onto
       * a second sheet. Paginated pages are full-bleed by definition
       * (content owns its insets). */
      .sheet.paginated .hdr-space,
      .sheet.paginated .ftr-space { height: 0; }
      .paginated ::slotted(.page) {
        border-radius: 0 !important;
        box-shadow: none !important;
        margin: 0 !important;
        /* Physical page-box sizing, no viewport units: Safari resolves
         * 100vh against the window, not the page box, so a vh-sized card
         * paginates wrong there. --doc-page-w/h are the named size by
         * default and are overridden to the user's chosen paper by the
         * export path, so every card is exactly one sheet either way.
         * Width + height (same source values as @page size) rather than
         * width + aspect-ratio: the ratio is a 6-decimal rounding of the
         * same division, and a few millionths of overflow would spill a
         * blank sheet after every page. The screen-only aspect-ratio
         * (preview proportions) must not leak into print. cqh typography
         * tracks the same box.
         *
         * Every declaration is !important: per CSS Scoping, unimportant
         * shadow ::slotted rules LOSE to the document context, so a page
         * section's authored inline style would silently beat this print
         * geometry. A model-authored height:100% did exactly that — the
         * percentage resolves as auto in the all-auto print ancestry, the
         * base rule's size containment turns auto into ZERO, and
         * overflow:hidden then paints nothing: a blank PDF with perfect
         * page boxes. At print the component's geometry is the design's
         * whole contract, so it must win over any authored sizing. */
        aspect-ratio: auto !important;
        width: var(--doc-page-w) !important;
        height: var(--doc-page-h) !important;
        overflow: hidden !important;
      }
      .paginated ::slotted(.page:not(:first-child)) {
        break-before: page !important;
        margin-top: 0 !important;
      }
    }
    .fit-mode .fit-box {
      width: calc(var(--doc-fit-w) * var(--doc-fit-scale));
      height: calc(var(--doc-fit-h) * var(--doc-fit-scale));
      margin: 0 auto;
      break-inside: avoid;
    }
    /* Monolithic at print: Blink slices a transform-scaled child at
     * fragmentainer boundaries mapped in UNSCALED layout coordinates
     * (transforms are paint-time), so the .fit box (authored size, e.g.
     * 1400x990) gets cut at the page's free block space and spills onto
     * a second sheet even though its SCALED footprint fits the page by
     * construction. overflow:hidden makes .fit-box a scroll container —
     * monolithic under fragmentation (css-break-3) — so the scaled
     * content prints atomically on one sheet. No clipping for content
     * within the authored box: .fit-box is calc-sized to exactly the
     * scaled footprint. (Content that bleeds past content-width/height
     * is clipped at the footprint — fit mode's contract; it previously
     * painted beyond it at print.) Print-only, so the screen rendering
     * keeps visible overflow for editor affordances.
     * The export path injects the same rule into frozen copies
     * (print-eval.ts om-print-fit-contain). The .fit-mode scope is
     * load-bearing: .fit-box wraps slotted content in EVERY mode, and an
     * unscoped overflow:hidden would make whole flowing documents
     * monolithic (one truncated sheet). overflow:hidden, never clip —
     * clip is not a scroll container, so not monolithic. */
    @media print {
      .fit-mode .fit-box { overflow: hidden; }
    }
    .fit-mode .fit {
      width: var(--doc-fit-w);
      height: var(--doc-fit-h);
      transform: scale(var(--doc-fit-scale));
      transform-origin: top left;
    }
    .frame td, .frame th { padding: 0; text-align: left; font-weight: inherit; }
    .hdr-space { height: var(--doc-hdr-h); }
    .ftr-space { height: var(--doc-ftr-h); }
    ::slotted([slot="header"]),
    ::slotted([slot="footer"]) { display: block; box-sizing: border-box; }
    @media print {
      :host { background: none; padding: 0; min-width: 0; min-height: 0; }
      .sheet {
        width: auto; margin: 0; box-shadow: none; border-radius: 0;
        padding: 0 var(--doc-page-margin);
      }
      /* The thead/tfoot spacers repeat on every page, so they carry the
       * vertical page margin (which the sheet's own padding cannot, since
       * that padding is consumed once on the first/last page). The running
       * header/footer are fixed inside that band. */
      /* The 0.35in is breathing room between a running header/footer and
       * the body; without one the spacer is exactly the page margin, so a
       * margin="0" full-bleed document gets truly full-bleed pages. */
      .hdr-space { height: max(var(--doc-page-margin), calc(var(--doc-hdr-h) + var(--doc-hdr-pad))); }
      .ftr-space { height: max(var(--doc-page-margin), calc(var(--doc-ftr-h) + var(--doc-ftr-pad))); }
      /* WebKit flowing documents: @page carries the vertical margin (see
       * _syncPrintPageRule), so the spacers keep only whatever a running
       * header/footer needs BEYOND it — page 1 would otherwise double its
       * top inset. Paginated sheets already zero their spacers above. */
      .sheet.wk-print:not(.paginated) .hdr-space { height: max(0px, calc(max(var(--doc-page-margin), calc(var(--doc-hdr-h) + var(--doc-hdr-pad))) - var(--doc-page-margin))); }
      .sheet.wk-print:not(.paginated) .ftr-space { height: max(0px, calc(max(var(--doc-page-margin), calc(var(--doc-ftr-h) + var(--doc-ftr-pad))) - var(--doc-page-margin))); }
      ::slotted([slot="header"]) {
        position: fixed; top: 0; left: 0; right: 0; margin: 0;
        padding: calc(var(--doc-page-margin) * 0.45) var(--doc-page-margin) 0;
      }
      ::slotted([slot="footer"]) {
        position: fixed; bottom: 0; left: 0; right: 0; margin: 0;
        padding: 0 var(--doc-page-margin) calc(var(--doc-page-margin) * 0.45);
      }
    }
  `;
  class DocPage extends HTMLElement {
    static get observedAttributes() {
      return ['size', 'width', 'height', 'margin', 'orientation', 'content-width', 'content-height'];
    }
    constructor() {
      super();
      this._root = this.attachShadow({
        mode: 'open'
      });
      this._mo = typeof MutationObserver === 'function' ? new MutationObserver(() => this._scheduleMeasure()) : null;
    }

    /** The named paper's [w, h], swapped when orientation="landscape".
     *  Only the named size swaps — explicit width/height are exact values
     *  the author already oriented. */
    _paperSize() {
      const named = PAPER[(this.getAttribute('size') || '').toLowerCase()] || PAPER.letter;
      const landscape = (this.getAttribute('orientation') || '').trim().toLowerCase() === 'landscape';
      return landscape ? [named[1], named[0]] : named;
    }
    get pageWidth() {
      return safeLen(this.getAttribute('width'), this._paperSize()[0]);
    }
    get pageHeight() {
      return safeLen(this.getAttribute('height'), this._paperSize()[1]);
    }
    get pageMargin() {
      return safeLen(this.getAttribute('margin'), '0.75in');
    }

    /** Scaled-fit mode's content box [w, h] as CSS lengths, or null when
     *  the mode is off (either attribute missing/invalid/zero — a partial
     *  declaration falls back to normal flow rather than guessing). */
    _contentFit() {
      const w = safeLen(this.getAttribute('content-width'), null);
      const h = safeLen(this.getAttribute('content-height'), null);
      if (!w || !h) return null;
      const wPx = toPx(w),
        hPx = toPx(h);
      return wPx > 0 && hPx > 0 ? [w, h, wPx, hPx] : null;
    }
    connectedCallback() {
      if (!this._sheet) this._render();
      this._syncSize();
      this._syncPrintPageRule();
      this._ensureTextWrapDefaults();
      this._ensureOwnsPrintMeta();
      this._syncFixedSizeMeta();
      this._syncPrintSizingMeta();
      if (this._mo) this._mo.observe(this, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true
      });
      this._onResize = () => this._scheduleMeasure();
      window.addEventListener('resize', this._onResize);
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => this._scheduleMeasure());
      }
      this._scheduleMeasure();
    }
    disconnectedCallback() {
      window.removeEventListener('resize', this._onResize);
      if (this._mo) this._mo.disconnect();
      if (this._raf) {
        cancelAnimationFrame(this._raf);
        this._raf = null;
      }
      // Drop the head rules when the last doc-page leaves, so a deleted
      // document's @page geometry and text-wrap defaults can't apply to
      // whatever replaces it.
      const survivor = document.querySelector('doc-page');
      if (!survivor) {
        ['doc-page-print', 'doc-page-text-wrap', 'doc-page-owns-print', 'doc-page-fixed-size', 'doc-page-print-sizing'].forEach(id => {
          const tag = document.getElementById(id);
          if (tag) tag.remove();
        });
        // A live deck-stage deferred its own print-sizing meta to ours —
        // hand the page-global meta over so the deck isn't left unmarked.
        const deck = document.querySelector('deck-stage');
        if (deck && typeof deck._ensurePrintSizingMeta === 'function') {
          deck._ensurePrintSizingMeta();
        }
      } else {
        // A departed owner hands each page-global meta to whatever
        // doc-page remains (or it's removed).
        if (typeof survivor._syncFixedSizeMeta === 'function') {
          survivor._syncFixedSizeMeta();
        }
        if (typeof survivor._syncPrintSizingMeta === 'function') {
          survivor._syncPrintSizingMeta();
        }
      }
    }
    attributeChangedCallback() {
      if (!this._sheet) return;
      this._syncSize();
      this._syncPrintPageRule();
      this._syncFixedSizeMeta();
      this._syncPrintSizingMeta();
      this._scheduleMeasure();
    }
    _render() {
      this._root.innerHTML = `
        <style>${stylesheet}</style>
        <style id="vars"></style>
        <div class="sheet" data-screen-label="Document">
          <table class="frame" role="presentation">
            <thead><tr><th><div class="hdr-space"><slot name="header"></slot></div></th></tr></thead>
            <tbody><tr><td class="body"><div class="fit-box"><div class="fit"><slot></slot></div></div></td></tr></tbody>
            <tfoot><tr><td><div class="ftr-space"><slot name="footer"></slot></div></td></tr></tfoot>
          </table>
        </div>`;
      this._sheet = this._root.querySelector('.sheet');
      this._vars = this._root.getElementById('vars');
    }

    /** Runtime sizing lives in a shadow <style> :host rule, never on the
     *  light-DOM host element, so serialize-persist can't write it back. */
    _syncSize(hdrH, ftrH) {
      // Scaled-fit mode: content at its authored size, scaled onto the
      // printable area (page minus margins on both axes). The factor is a
      // plain number var so calc(length * number) stays valid; 4 decimals
      // keeps the shadow style stable across re-measures. Upscaling is
      // allowed — print transforms are vector, so text and CSS stay crisp
      // (raster images soften, which the catalog bullet warns about).
      const fit = this._contentFit();
      let fitVars = '';
      if (fit) {
        const marginPx = toPx(this.pageMargin) || 0;
        const availW = toPx(this.pageWidth) - 2 * marginPx;
        const availH = toPx(this.pageHeight) - 2 * marginPx;
        const scale = Math.min(availW / fit[2], availH / fit[3]);
        if (scale > 0 && Number.isFinite(scale)) {
          fitVars = '--doc-fit-w:' + fit[0] + ';' + '--doc-fit-h:' + fit[1] + ';' + '--doc-fit-scale:' + scale.toFixed(4) + ';';
        }
      }
      this._sheet.classList.toggle('fit-mode', !!fitVars);
      // Numeric w/h ratio for the paginated page cards' aspect-ratio —
      // aspect-ratio takes a number, not a length ratio, so compute it
      // here (CSS length division isn't portable). 6 decimals keeps the
      // shadow style stable across re-syncs.
      const arW = toPx(this.pageWidth);
      const arH = toPx(this.pageHeight);
      const ar = arW > 0 && arH > 0 ? (arW / arH).toFixed(6) : '0.772727';
      this._vars.textContent = ':host{' + fitVars + '--doc-page-ar:' + ar + ';' + '--doc-page-w:' + this.pageWidth + ';' + '--doc-page-h:' + this.pageHeight + ';' + '--doc-page-margin:' + this.pageMargin + ';' + '--doc-hdr-h:' + (hdrH || 0) + 'px;' + '--doc-ftr-h:' + (ftrH || 0) + 'px;' + '--doc-hdr-pad:' + (hdrH ? '0.35in' : '0px') + ';' + '--doc-ftr-pad:' + (ftrH ? '0.35in' : '0px') + '}';
    }

    /** @page is a no-op inside shadow DOM, so the rule lives in <head>.
     *  Re-appended on every sync so it stays last in source order — the
     *  @page cascade is source-order per descriptor, so this rule wins
     *  over any other @page rule in the document.
     *
     *  The @page SIZE is pinned where the page box IS part of the design:
     *  explicit-fixed-size mode (width + height authored), scaled-fit
     *  mode (the named sheet the fit targets), and explicit pagination
     *  (the named size the cards share — so card and sheet agree on
     *  every print path, and the export path's chosen paper overrides
     *  BOTH with one later rule). For FLOWING documents no paper size is
     *  emitted at all — the true size comes from the user's preference,
     *  injected by the export path or chosen in the print dialog — so a
     *  flowing document never fights the paper it lands on.
     *  margin: 0 is emitted in every mode: it leaves Chrome no margin box
     *  to draw its date/URL/page-count header in, and the visual margin
     *  lives on the sheet's own padding. */
    _syncPrintPageRule() {
      const id = 'doc-page-print';
      let tag = document.getElementById(id);
      if (!tag) {
        tag = document.createElement('style');
        tag.id = id;
      }
      document.head.appendChild(tag);
      // Three print-geometry regimes:
      // - true-size: the page IS the design — pin its exact size.
      // - scaled-fit (content-width/height): the fit factor is computed
      //   against the NAMED paper's printable area, so that paper must
      //   stay pinned or the scaled content overflows a smaller sheet
      //   (the export path re-fits and re-pins at print time on top).
      // - default modes: no paper size — but landscape still needs the
      //   paper-agnostic 'size: landscape' keyword, because the size
      //   descriptor is what carries orientation; without it a landscape
      //   document prints portrait whenever nothing injects a size.
      const landscape = (this.getAttribute('orientation') || '').trim().toLowerCase() === 'landscape';
      // Explicit pagination pins the page box to the SAME values that
      // size the cards (the named size by default, the export path's
      // chosen paper when its later rule overrides both) — card and
      // sheet agree on every print path, and a mismatched real paper
      // shrinks-to-fit in the dialog instead of clipping a Letter card
      // on A4. Declared before the paginated read below so both derive
      // from one check.
      const paginatedNow = this.querySelector(':scope > .page') !== null;
      const sizeDescriptor = this._trueSizePx() ? 'size: ' + this.pageWidth + ' ' + this.pageHeight + '; ' : this._contentFit() ? 'size: ' + this.pageWidth + ' ' + this.pageHeight + '; ' : paginatedNow ? 'size: ' + this.pageWidth + ' ' + this.pageHeight + '; ' : landscape ? 'size: landscape; ' : '';
      // WebKit never repeats the thead/tfoot spacers that carry a flowing
      // document's vertical page margins (see WK_PRINT above), so pages
      // after the first print edge-to-edge there. Carry the VERTICAL
      // margins on @page for WebKit instead, and the shadow print CSS
      // trims the first-page spacers by the same amount (.sheet.wk-print
      // rules). Horizontal inset stays on the sheet's own padding in
      // every engine. Blink keeps margin: 0 (a nonzero margin there
      // re-opens the box Chrome draws its header furniture in). One cost,
      // learned in testing: Safari's own date/URL headers are a USER
      // dialog setting ("Print headers and footers") that renders in the
      // margin area when room exists — margin: 0 only suppressed it by
      // leaving no room, and no CSS controls it. The export dialog's
      // Safari guide teaches turning the setting off for flowing
      // documents. Explicitly paginated and fixed-size documents keep
      // margin: 0 everywhere: their pages ARE the sheet.
      const wkFlowing = WK_PRINT && !paginatedNow && !this._trueSizePx() && !this._contentFit();
      const marginDescriptor = wkFlowing ? 'margin: ' + this.pageMargin + ' 0; ' : 'margin: 0; ';
      // Shadow-internal marker (never serialized), kept in lockstep with
      // the @page decision above: the print CSS trims the first-page
      // spacers ONLY while @page actually carries the margins — a
      // true-size or scaled-fit sheet keeps margin: 0 and must keep its
      // spacers too. Re-synced here so attribute changes and pagination
      // flips move both together.
      if (this._sheet) this._sheet.classList.toggle('wk-print', wkFlowing);
      tag.textContent = '@page { ' + sizeDescriptor + marginDescriptor + '} ' + '@media print { html, body { margin: 0 !important; padding: 0 !important; background: none !important; height: auto !important; overflow: visible !important; } ' + 'h1,h2,h3,h4,h5,h6 { break-after: avoid; } ' + 'figure,pre,blockquote,img,svg,tr { break-inside: avoid; } ' + 'p,li { orphans: 3; widows: 3; } ' + '* { -webkit-print-color-adjust: exact; print-color-adjust: exact; ' + 'backdrop-filter: none !important; -webkit-backdrop-filter: none !important; } ' + '*, *::before, *::after { animation-delay: -99s !important; animation-duration: .001s !important; ' + 'animation-iteration-count: 1 !important; animation-fill-mode: both !important; ' + 'animation-play-state: running !important; transition-duration: 0s !important; } }';
    }

    /** Typographic defaults for document text: balance headings, avoid
     *  widowed/orphaned words in body copy (browsers without text-wrap
     *  support drop the declarations). Zero-specificity via :where() so
     *  any text-wrap authored on those elements wins; document-level so the
     *  rules reach the slotted (light DOM) content — shadow styles can't.
     *  data-omelette-injected marks the tag for the host editor to strip
     *  at serialize, so it is never written back as authored source. */
    _ensureTextWrapDefaults() {
      if (document.getElementById('doc-page-text-wrap')) return;
      const tag = document.createElement('style');
      tag.id = 'doc-page-text-wrap';
      tag.setAttribute('data-omelette-injected', '');
      tag.textContent = ':where(h1,h2,h3,h4,h5,h6){text-wrap:balance}' + ':where(p,li,blockquote,figcaption){text-wrap:pretty}';
      document.head.appendChild(tag);
    }

    /** Declares that this document owns its print CSS. The instant-PDF
     *  export checks for the meta by NAME PRESENCE alone (content is
     *  ignored) and skips its automatic print-CSS injections, so the
     *  component's @page geometry is never overridden by a heuristic.
     *  data-omelette-injected keeps it out of serialized source. */
    _ensureOwnsPrintMeta() {
      if (document.getElementById('doc-page-owns-print')) return;
      const tag = document.createElement('meta');
      tag.id = 'doc-page-owns-print';
      tag.name = 'omelette-owns-print';
      tag.content = 'true';
      tag.setAttribute('data-omelette-injected', '');
      document.head.appendChild(tag);
    }

    /** This page's valid true-size page box (explicit width AND height)
     *  as [w, h] px ints, or null when the mode is off. */
    _trueSizePx() {
      if (!safeLen(this.getAttribute('width'), null) || !safeLen(this.getAttribute('height'), null)) return null;
      const w = Math.round(toPx(this.pageWidth));
      const h = Math.round(toPx(this.pageHeight));
      return w > 0 && h > 0 ? [w, h] : null;
    }

    /** True-size pages (explicit width AND height) also declare the page
     *  box as the preview size: the in-app preview reads
     *  meta[name="omelette-fixed-size"] (content "W,H" in px ints) and
     *  scales the sheet into view — without it an 18in poster previews at
     *  true size with scrollbars. Never overrides an author-set meta
     *  (only the component's own id is managed). The meta is page-global
     *  while doc-page instances are not, so every sync recomputes the
     *  page-wide owner — the first connected true-size doc-page — and a
     *  non-true-size sibling's sync can never delete the owner's meta.
     *  Removed when no true-size page remains (the owner's disconnect
     *  re-syncs via any survivor) or when an author-set meta exists. */
    _syncFixedSizeMeta() {
      const id = 'doc-page-fixed-size';
      const own = document.getElementById(id);
      const authored = document.querySelector('meta[name="omelette-fixed-size"]:not([data-omelette-injected])');
      // The page-wide owner, not this instance: an upgraded true-size page
      // anywhere in the document keeps the meta alive and sized.
      let box = null;
      for (const el of document.querySelectorAll('doc-page')) {
        box = typeof el._trueSizePx === 'function' ? el._trueSizePx() : null;
        if (box) break;
      }
      if (!box || authored) {
        if (own) own.remove();
        return;
      }
      const tag = own || document.createElement('meta');
      tag.id = id;
      tag.name = 'omelette-fixed-size';
      tag.content = box[0] + ',' + box[1];
      tag.setAttribute('data-omelette-injected', '');
      if (!own) document.head.appendChild(tag);
    }

    /** This page's print-sizing mode: 'fixed' when an explicit width AND
     *  height are authored (the page is the design's own size), else the
     *  default paper in the authored orientation. */
    _printSizingMode() {
      if (this._trueSizePx()) return 'fixed';
      const landscape = (this.getAttribute('orientation') || '').trim().toLowerCase() === 'landscape';
      return landscape ? 'default-landscape' : 'default-portrait';
    }

    /** Announces the print-sizing mode to the host app:
     *  meta[name="omelette-print-sizing"] with content 'default-portrait',
     *  'default-landscape', or 'fixed' (fixed pages also carry the
     *  omelette-fixed-size meta with the page box in px). The export path
     *  probes it to decide what true paper size to inject at print time —
     *  in the default modes the component emits no paper size of its own.
     *  Same page-global ownership rules as the fixed-size meta above:
     *  first connected doc-page owns it, an authored meta is never
     *  overridden, removed when no doc-page remains. */
    _syncPrintSizingMeta() {
      const id = 'doc-page-print-sizing';
      const own = document.getElementById(id);
      const authored = document.querySelector('meta[name="omelette-print-sizing"]:not([data-omelette-injected])');
      // A fixed page wins outright (mirroring the fixed-size loop above,
      // so the two metas can never contradict each other in a mixed
      // multi-page document); otherwise the first page's mode holds.
      let mode = null;
      for (const el of document.querySelectorAll('doc-page')) {
        if (typeof el._printSizingMode !== 'function') continue;
        const m = el._printSizingMode();
        if (m === 'fixed') {
          mode = m;
          break;
        }
        if (mode === null) mode = m;
      }
      if (!mode || authored) {
        if (own) own.remove();
        return;
      }
      // A deck-stage that connected first injected its own meta and
      // defers to any existing one — take it over, or the document ends
      // up with two conflicting injected metas (a doc-page page is the
      // document; the deck re-ensures its meta if every doc-page leaves).
      const deckMeta = document.getElementById('deck-stage-print-sizing');
      if (deckMeta) deckMeta.remove();
      const tag = own || document.createElement('meta');
      tag.id = id;
      tag.name = 'omelette-print-sizing';
      tag.content = mode;
      tag.setAttribute('data-omelette-injected', '');
      if (!own) document.head.appendChild(tag);
    }
    _scheduleMeasure() {
      if (this._raf) return;
      this._raf = requestAnimationFrame(() => {
        this._raf = null;
        this._measure();
      });
    }

    /** Slot heights feed the print spacers (--doc-hdr-h / --doc-ftr-h), so
     *  they re-measure on content mutation, resize, and font load. The
     *  same pass detects explicit pagination (direct .page children) and
     *  toggles the sheet between the flowing-document card and the
     *  page-per-card stack — content edits can add or remove pages at any
     *  time, so this tracks the same mutations the measurement does. */
    _measure() {
      const hdr = this.querySelector(':scope > [slot="header"]');
      const ftr = this.querySelector(':scope > [slot="footer"]');
      const wasPaginated = this._sheet.classList.contains('paginated');
      this._sheet.classList.toggle('paginated', this.querySelector(':scope > .page') !== null);
      // The WebKit @page margin is flowing-only, so a pagination flip
      // must re-emit the rule (content edits can add or remove .page
      // sections at any time).
      if (this._sheet.classList.contains('paginated') !== wasPaginated) {
        this._syncPrintPageRule();
      }
      this._syncSize(hdr ? hdr.offsetHeight : 0, ftr ? ftr.offsetHeight : 0);
    }
  }
  if (!customElements.get('doc-page')) {
    customElements.define('doc-page', DocPage);
  }
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing-site/doc-page.js", error: String((e && e.message) || e) }); }

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.Wordmark = __ds_scope.Wordmark;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.TextLink = __ds_scope.TextLink;

__ds_ns.TextInput = __ds_scope.TextInput;

__ds_ns.Band = __ds_scope.Band;

__ds_ns.CardGrid = __ds_scope.CardGrid;

__ds_ns.Footer = __ds_scope.Footer;

__ds_ns.TopNav = __ds_scope.TopNav;

__ds_ns.TopicFilterRail = __ds_scope.TopicFilterRail;

__ds_ns.PricingComparisonRow = __ds_scope.PricingComparisonRow;

__ds_ns.PricingTierCard = __ds_scope.PricingTierCard;

__ds_ns.RainbowStripeHero = __ds_scope.RainbowStripeHero;

__ds_ns.ArticleCard = __ds_scope.ArticleCard;

__ds_ns.CalloutCard = __ds_scope.CalloutCard;

__ds_ns.CtaBand = __ds_scope.CtaBand;

__ds_ns.DemoGridCard = __ds_scope.DemoGridCard;

__ds_ns.FeatureCardTabbed = __ds_scope.FeatureCardTabbed;

__ds_ns.HeroBand = __ds_scope.HeroBand;

__ds_ns.LogoStrip = __ds_scope.LogoStrip;

__ds_ns.MediaPlaceholder = __ds_scope.MediaPlaceholder;

__ds_ns.SignatureCard = __ds_scope.SignatureCard;

})();
