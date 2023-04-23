const template = /*html*/ `
<template>
    <slot style="display: flex; flex-direction: row; flex: 1 1 auto; align-items: flex-start;"></slot>
</template>`;

let fragment: DocumentFragment;

class FlexRow extends HTMLElement {
  static observedAttributes = ["wrap", "reverse"] as const;

  #elementsCache: {
    rootElement?: CSSStyleDeclaration;
  } = {};

  connectedCallback() {
    if (!fragment) fragment = new DOMParser().parseFromString(template, "text/html").head.querySelector("template")!.content;
    const myFragment = fragment.cloneNode(true) as DocumentFragment;
    this.#elementsCache.rootElement = (myFragment.firstElementChild as HTMLElement).style;
    for (const attribute of FlexRow.observedAttributes) this.attributeChangedCallback(attribute, "", this.getAttribute(attribute));
    this.attachShadow({ mode: "closed" }).appendChild(myFragment);
  }

  // reflect properties to attributes
  get wrap() {
    return this.getAttribute("wrap");
  }
  set wrap(value: string | null) {
    this.setAttribute("wrap", value || "");
  }

  get reverse() {
    return this.getAttribute("reverse");
  }
  set reverse(value: string | null) {
    if (value == null) this.removeAttribute("reverse");
    else this.setAttribute("reverse", value);
  }

  // reflect attributes to properties
  attributeChangedCallback(name: (typeof FlexRow.observedAttributes)[number], oldValue: string | null, newValue: string | null) {
    if (oldValue === newValue) return; // prevent infinite loop
    //console.log("name", name, "old", oldValue, "new", newValue);
    switch (name) {
      case "wrap":
        this.#elementsCache.rootElement!.setProperty(name, newValue);
        return;
      case "reverse":
        // newValue = null means attr is now missing;  newValue == "" means attribute there
        this.#elementsCache.rootElement!.setProperty("flex-direction", newValue == "" || (!!newValue && newValue != "false") ? "row-reverse" : "row");
        return;
    }
  }
}

customElements.define("flex-row", FlexRow);
