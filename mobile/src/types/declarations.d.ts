// Type declarations for modules without TypeScript definitions

declare module 'react-native-vector-icons/Ionicons' {
  import { Component } from 'react';
  import { TextStyle, ViewStyle, TextProps } from 'react-native';

  interface IconProps extends TextProps {
    name: string;
    size?: number;
    color?: string;
    style?: TextStyle | ViewStyle;
  }

  export default class Icon extends Component<IconProps> {}
}

declare module 'react-native-linear-gradient' {
  import { Component } from 'react';
  import { ViewProps } from 'react-native';

  interface LinearGradientProps extends ViewProps {
    colors: (string | number)[];
    start?: { x: number; y: number };
    end?: { x: number; y: number };
    locations?: number[];
    useAngle?: boolean;
    angle?: number;
    angleCenter?: { x: number; y: number };
  }

  export default class LinearGradient extends Component<LinearGradientProps> {}
}

declare module 'react-native-sqlite-storage' {
  export interface SQLiteDatabase {
    transaction(fn: (tx: SQLiteTransaction) => void): Promise<void>;
    executeSql(
      sql: string,
      params?: any[]
    ): Promise<[SQLResultSet]>;
    close(): Promise<void>;
  }

  export interface SQLiteTransaction {
    executeSql(
      sql: string,
      params?: any[],
      callback?: (tx: SQLiteTransaction, results: SQLResultSet) => void,
      errorCallback?: (tx: SQLiteTransaction, error: SQLError) => boolean
    ): void;
  }

  export interface SQLResultSet {
    rows: {
      length: number;
      item(index: number): any;
      raw(): any[];
    };
    insertId?: number;
    rowsAffected: number;
  }

  export interface SQLError {
    code: number;
    message: string;
  }

  export function openDatabase(
    params: {
      name: string;
      location?: string;
      createFromLocation?: number | string;
    },
    successCallback?: () => void,
    errorCallback?: (error: SQLError) => void
  ): SQLiteDatabase;

  export function enablePromise(enable: boolean): void;
  export function DEBUG(enable: boolean): void;

  const SQLite: {
    openDatabase: typeof openDatabase;
    enablePromise: typeof enablePromise;
    DEBUG: typeof DEBUG;
  };

  export default SQLite;
}

// Timer type alias for React Native compatibility
type TimerRef = ReturnType<typeof setTimeout> | null;
