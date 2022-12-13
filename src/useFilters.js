import * as React from "react";
import { useLocation } from "./useLocation";
import { parse as parseQS } from "qs";
const parseQueryString = (string) =>
  parseQS(string, { ignoreQueryPrefix: true, arrayFormat: "indices" });

// ruby's 'dig' for JS
// adapted from https://github.com/joe-re/object-dig/blob/master/src/index.js
const dig = (target, keys = []) => {
  let digged = target;
  for (const key of keys) {
    if (typeof digged === "undefined" || digged === null) {
      return undefined;
    }
    digged = digged[key];
  }
  return digged;
};

// option builders
const buildOption = (name, value, label) => {
  const id = `${name}_${String(value).toLowerCase().split(" ").join("_")}`;

  return { id, name, value, label };
};

const buildOptions = (collection, filter) => {
  let options = [];

  for (let item of collection) {
    if (filter.optionValueKeys) {
      // value and label will be matching strings
      const rawValue = dig(item, filter.optionValueKeys);

      if (Array.isArray(rawValue)) {
        // associated with many
        for (let value of rawValue) {
          if (!!value && !options.some((opt) => opt.value === value)) {
            const label = value;
            const option = buildOption(filter.filterKey, value, label);
            options.push(option);
          }
        }
      } else {
        // is as is
        if (!!rawValue && !options.some((opt) => opt.value === rawValue)) {
          const label = rawValue;
          const option = buildOption(filter.filterKey, rawValue, label);
          options.push(option);
        }
      }
    } else {
      // label != value but come from same object
      const rawNestedItem = dig(item, filter.optionKeys);

      if (Array.isArray(rawNestedItem)) {
        for (let nestedItem of rawNestedItem) {
          const value = dig(nestedItem, filter.valueKeys);

          if (!!value && !options.some((opt) => opt.value === value)) {
            const label = dig(nestedItem, filter.labelKeys);
            const option = buildOption(filter.filterKey, value, label);
            options.push(option);
          }
        }
      } else {
        const value = dig(rawNestedItem, filter.valueKeys);

        if (!!value && !options.some((opt) => opt.value === value)) {
          const label = dig(rawNestedItem, filter.labelKeys);
          const option = buildOption(filter.filterKey, value, label);
          options.push(option);
        }
      }
    }
  }

  if (!!filter.sort) {
    return options.sort(filter.sort);
  } else {
    return options.sort((a, b) => a.value.localeCompare(b.value));
  }
};

// builds initial filter state
// looks like `{ filterKey1: initialValue1, filterKey2, initialValue2 }`
const buildInitialFilter = (filters, searchParams) =>
  filters.reduce((initialFilter, filter) => {
    initialFilter[filter.filterKey] =
      dig(searchParams, [filter.filterKey]) ?? []; // checkbox assumed!
    return initialFilter;
  }, {});

// callback to filter active items in collection
const filterItem = (item, activeFilter, filters) => {
  // check check filter key, try to knock out
  // only supports value collections (checkbox)
  for (const filter of filters) {
    const activeValue = activeFilter[filter.filterKey];

    if (activeValue?.length) {
      if (filter.optionValueKeys) {
        // value and label are matching strings
        const rawValue = dig(item, filter.optionValueKeys);

        if (Array.isArray(rawValue)) {
          // filter for any overlap
          if (!activeValue.some((val) => rawValue.includes(val))) {
            return false;
          }
        } else {
          // filter for exact matching
          if (!activeValue.includes(rawValue)) {
            return false;
          }
        }
      } else {
        // label != value but come from same object
        const rawNestedItem = dig(item, filter.optionKeys);

        if (Array.isArray(rawNestedItem)) {
          // filter for any overlap
          const itemValues = rawNestedItem.map((nested) =>
            dig(nested, filter.valueKeys)
          );
          if (!activeValue.some((val) => itemValues.includes(val))) {
            return false;
          }
        } else {
          // filter for exact matching
          const itemValue = dig(rawNestedItem, filter.valueKeys);
          if (!activeValue.includes(itemValue)) {
            return false;
          }
        }
      }
    }
  }

  return true; // nothing said no!
};

const useSearchParams = () => {
  const { search } = useLocation();
  const memoized = React.useMemo(() => parseQueryString(search), [search]);

  return memoized;
};

// Finally...
// the actual hook
// NOTE: currently only checkbox filters are supported

const useFilters = (filterTemplate, collection) => {
  const searchParams = useSearchParams();

  const filters = React.useMemo(
    () =>
      filterTemplate
        .map((filter) => ({
          ...filter,
          options: buildOptions(collection, filter),
        }))
        .filter((filter) => filter.options.length > 1),
    [filterTemplate, collection]
  );
  const [activeFilter, setActiveFilter] = React.useState(
    buildInitialFilter(filters)
  );

  // if filters change (like from a fetch request or navigation),
  // be sure initial filter state watches!
  React.useEffect(() => {
    setActiveFilter(() => buildInitialFilter(filters, searchParams));
  }, [filters, searchParams]);

  const activeCollection = React.useMemo(
    () => collection.filter((item) => filterItem(item, activeFilter, filters)),
    [collection, filters, activeFilter]
  );

  return [filters, activeFilter, activeCollection];
};

export default useFilters;
