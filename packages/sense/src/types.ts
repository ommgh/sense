export type Fiber = {
  type?: any;
  props: any;
  dom?: Node | null;
  parent?: Fiber;
  child?: Fiber;
  sibling?: Fiber;
  alternate?: Fiber | null;
  effectTag?: "PLACEMENT" | "UPDATE" | "DELETION";
  hooks?: Hook[];
  key?: string | number | null;
};

export type Hook = {
  tag: "STATE" | "EFFECT";
  state?: any;
  queue?: any[];
  callback?: () => Function | void;
  deps?: any[];
  cleanup?: Function | void;
};

export type SenseElement = {
  type: any;
  props: {
    children: SenseElement[];
    [key: string]: any;
  };
  key?: string | number | null;
};
