import React, { FC } from 'react';
import { mount } from 'enzyme';
import { useField, UseFieldResponse } from './useField';
import { FielderContext } from './context';
import { FieldConfig } from './types';

let context = {
  fields: {},
  mountField: jest.fn(),
  unmountField: jest.fn(),
  blurField: jest.fn(),
  setFieldValue: jest.fn()
};
let response: UseFieldResponse;
let args: FieldConfig<any>;

const F: FC = ({ children }) => {
  response = useField(args);

  return <>{children}</>;
};

const Fixture: FC = ({ children }) => {
  return (
    <FielderContext.Provider value={context as any}>
      <F>{children}</F>
    </FielderContext.Provider>
  );
};

beforeEach(jest.clearAllMocks);

beforeEach(() => {
  context = {
    fields: {},
    mountField: jest.fn(),
    unmountField: jest.fn(),
    blurField: jest.fn(),
    setFieldValue: jest.fn()
  };
});

describe('on mount', () => {
  it('calls mountField with default values', () => {
    args = { name: 'someField' };
    mount(<Fixture />);

    expect(context.mountField).toBeCalledTimes(1);
    expect(context.mountField).toBeCalledWith({
      name: args.name,
      initialError: undefined,
      initialValid: true,
      initialValue: undefined,
      initialTouched: false,
      validate: undefined,
      validateOnBlur: true,
      validateOnChange: true,
      validateOnUpdate: false
    });
  });

  it('calls mountField with default values (validate function provided)', () => {
    args = { name: 'someField', validate: jest.fn() };
    mount(<Fixture />);

    expect(context.mountField).toBeCalledTimes(1);
    expect(context.mountField).toBeCalledWith({
      name: args.name,
      initialError: undefined,
      initialValid: false,
      initialValue: undefined,
      initialTouched: false,
      validate: args.validate,
      validateOnBlur: true,
      validateOnChange: true,
      validateOnUpdate: false
    });
  });

  it('calls mountField with default overrides', () => {
    args = {
      name: 'someField',
      initialError: 'aaa',
      initialValid: true,
      initialValue: 'hello',
      initialTouched: true,
      validate: jest.fn(),
      validateOnBlur: false,
      validateOnChange: false,
      validateOnUpdate: true
    };
    mount(<Fixture />);

    expect(context.mountField).toBeCalledTimes(1);
    expect(context.mountField).toBeCalledWith({
      ...args
    });
  });
});

describe('on unmount', () => {
  it('calls unmountField', () => {
    args = { name: 'someField' };
    const wrapper = mount(<Fixture />);
    wrapper.unmount();

    expect(context.unmountField).toBeCalledTimes(1);
    expect(context.unmountField).toBeCalledWith({
      name: args.name,
      destroy: false
    });
  });

  it('calls unmountField and destroys value', () => {
    args = { name: 'someField', destroyOnUnmount: true };
    const wrapper = mount(<Fixture />);
    wrapper.unmount();

    expect(context.unmountField).toBeCalledTimes(1);
    expect(context.unmountField).toBeCalledWith({
      name: args.name,
      destroy: true
    });
  });

  it('calls unmountField and passes destroy value after change', () => {
    args = { name: 'someField', destroyOnUnmount: false };
    const wrapper = mount(<Fixture />);
    args = { ...args, destroyOnUnmount: true };
    wrapper.setProps({});
    wrapper.unmount();

    expect(context.unmountField).toBeCalledTimes(1);
    expect(context.unmountField).toBeCalledWith({
      name: args.name,
      destroy: true
    });
  });
});

describe('on blur', () => {
  beforeEach(() => {
    args = { name: 'someField' };
    const wrapper = mount(<Fixture />);
    response[0].onBlur();
    wrapper.setProps({});
  });

  it('calls blurField', () => {
    expect(context.blurField).toBeCalledTimes(1);
    expect(context.blurField).toBeCalledWith({
      name: args.name
    });
  });
});

describe('on change', () => {
  describe('basic input', () => {
    it('calls setFieldValue', () => {
      const value = 'newval';
      const target = document.createElement('input');
      target.type = 'text';
      target.value = value;

      args = { name: 'someField' };

      mount(<Fixture />);
      response[0].onChange({
        currentTarget: target
      } as any);

      expect(context.setFieldValue).toBeCalledTimes(1);
      expect(context.setFieldValue).toBeCalledWith({
        name: args.name,
        value
      });
    });
  });

  describe('textarea input', () => {
    it('calls setFieldValue', () => {
      const value = 'newval';
      args = { name: 'someField' };

      mount(<Fixture />);
      response[0].onChange({
        currentTarget: {
          tagName: 'TEXTAREA',
          getAttribute: () => undefined,
          value
        }
      } as any);

      expect(context.setFieldValue).toBeCalledTimes(1);
      expect(context.setFieldValue).toBeCalledWith({
        name: args.name,
        value
      });
    });
  });

  describe('radio input', () => {
    it('calls setFieldValue', () => {
      const value = 'newval';
      args = { name: 'someField' };

      mount(<Fixture />);
      response[0].onChange({
        currentTarget: {
          tagName: 'INPUT',
          getAttribute: () => 'radio',
          value
        }
      } as any);

      expect(context.setFieldValue).toBeCalledTimes(1);
      expect(context.setFieldValue).toBeCalledWith({
        name: args.name,
        value
      });
    });
  });

  describe('checkbox input', () => {
    const value = 'newval';
    args = { name: 'someField' };

    beforeEach(() => {
      mount(<Fixture />);
      response[0].onChange({
        currentTarget: {
          tagName: 'INPUT',
          getAttribute: () => 'checkbox',
          value
        }
      } as any);
    });

    it('calls setFieldValue', () => {
      expect(context.setFieldValue).toBeCalledTimes(1);
      expect(context.setFieldValue).toBeCalledWith(
        expect.objectContaining({
          name: args.name
        })
      );
    });

    describe('on setFieldValue value function', () => {
      let valueFn: Function;
      const otherVals = ['other', 'again'];

      beforeEach(() => {
        valueFn = context.setFieldValue.mock.calls[0][0].value;
      });

      it('instantiates array with value', () => {
        expect(valueFn()).toEqual([value]);
      });

      it('removes value from array', () => {
        expect(valueFn([...otherVals, value])).toEqual(otherVals);
      });

      it('appends value to array', () => {
        expect(valueFn(otherVals)).toEqual([...otherVals, value]);
      });
    });
  });

  describe('select input', () => {
    it('calls setFieldValue', () => {
      const value = 'newval';
      args = { name: 'someField' };

      mount(<Fixture />);
      response[0].onChange({
        currentTarget: {
          tagName: 'SELECT',
          value,
          getAttribute: () => undefined
        }
      } as any);

      expect(context.setFieldValue).toBeCalledTimes(1);
      expect(context.setFieldValue).toBeCalledWith({
        name: args.name,
        value
      });
    });
  });
});

describe('on checkbox ref', () => {
  let ref1: HTMLInputElement;
  let ref2: HTMLInputElement;
  let ref3: HTMLInputElement;

  beforeEach(() => {
    ref1 = document.createElement('input');
    ref1.type = 'checkbox';
    ref1.value = 'notmatching';

    ref2 = document.createElement('input');
    ref2.type = 'checkbox';
    ref2.value = 'matching';

    ref3 = document.createElement('input');
    ref3.type = 'text';
    ref3.value = 'matching';
  });

  it('sets checked on element (with initial value)', () => {
    args = { name: 'someField', initialValue: ['matching'] };

    mount(<Fixture />);
    response[0].ref(ref1);
    response[0].ref(ref2);
    response[0].ref(ref3);

    expect(ref1.checked).toEqual(false);
    expect(ref2.checked).toEqual(true);
    expect(ref3.checked).toEqual(false);
  });

  it('sets checked on element (without initial value)', () => {
    args = { name: 'someField' };

    mount(<Fixture />);
    response[0].ref(ref1);
    response[0].ref(ref2);
    response[0].ref(ref3);

    expect(ref1.checked).toEqual(false);
    expect(ref2.checked).toEqual(false);
    expect(ref3.checked).toEqual(false);
  });

  describe('on value update', () => {
    beforeEach(() => {
      args = { name: 'someField' };
      const wrapper = mount(<Fixture />);

      response[0].ref(ref1);
      response[0].ref(ref2);
      response[0].ref(ref3);

      context = {
        ...context,
        fields: {
          someField: {
            name: 'someField',
            value: ['matching']
          }
        }
      };
      wrapper.setProps({});
    });

    it('sets checked', () => {
      expect(ref1.checked).toEqual(false);
      expect(ref2.checked).toEqual(true);
      expect(ref3.checked).toEqual(false);
    });
  });
});

describe('on radio ref', () => {
  let ref1: HTMLInputElement;
  let ref2: HTMLInputElement;
  let ref3: HTMLInputElement;

  beforeEach(() => {
    ref1 = document.createElement('input');
    ref1.type = 'radio';
    ref1.value = 'notmatching';

    ref2 = document.createElement('input');
    ref2.type = 'radio';
    ref2.value = 'matching';

    ref3 = document.createElement('input');
    ref3.type = 'text';
    ref3.value = 'matching';
  });

  it('sets checked on element (with initial value)', () => {
    args = { name: 'someField', initialValue: 'matching' };

    mount(<Fixture />);
    response[0].ref(ref1);
    response[0].ref(ref2);
    response[0].ref(ref3);

    expect(ref1.checked).toEqual(false);
    expect(ref2.checked).toEqual(true);
    expect(ref3.checked).toEqual(false);
  });

  it('sets checked on element (without initial value)', () => {
    args = { name: 'someField' };

    mount(<Fixture />);
    response[0].ref(ref1);
    response[0].ref(ref2);
    response[0].ref(ref3);

    expect(ref1.checked).toEqual(false);
    expect(ref2.checked).toEqual(false);
    expect(ref3.checked).toEqual(false);
  });

  describe('on value update', () => {
    beforeEach(() => {
      args = { name: 'someField' };
      const wrapper = mount(<Fixture />);

      response[0].ref(ref1);
      response[0].ref(ref2);
      response[0].ref(ref3);

      context = {
        ...context,
        fields: {
          someField: {
            name: 'someField',
            value: 'matching'
          }
        }
      };
      wrapper.setProps({});
    });

    it('sets checked', () => {
      expect(ref1.checked).toEqual(false);
      expect(ref2.checked).toEqual(true);
      expect(ref3.checked).toEqual(false);
    });
  });
});