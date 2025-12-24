declare namespace JSX {
  interface Element {
    type: any;
    props: any;
  }

  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
