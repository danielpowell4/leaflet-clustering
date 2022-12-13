import * as React from "react"; // history.push could work similarily if you aren't on gatsby!
import { Formik, Field, useFormikContext } from "formik";
import { useLocation } from "./useLocation";
import { stringify as stringifyQS } from "qs";

export const buildQueryString = (object) =>
  stringifyQS(object, { arrayFormat: "indices" });

// import "./FilterForm.scss";

const FilterCheckboxGroup = ({ filter }) => {
  const labelId = `${filter.filterKey}_label`;

  return (
    <div className="filter-group">
      <h4 className="filter-group__label" id={labelId}>
        {filter.label}
      </h4>
      <ul
        className="filter-group__options"
        role="group"
        aria-labelledby={labelId}
      >
        {filter.options.map((opt) => (
          <li className="filter-group__options__item" key={opt.id}>
            <Field
              type={filter.type}
              id={opt.id}
              name={opt.name}
              value={opt.value}
            />
            <label htmlFor={opt.id}>{opt.label}</label>
          </li>
        ))}
      </ul>
    </div>
  );
};

// based off of formik's AutoSave example
const DELAY = 200;
const SubmitOnChange = () => {
  const { submitForm, values } = useFormikContext();
  const firstMountedAt = React.useRef(false); // skips save on initial load

  React.useEffect(() => {
    if (firstMountedAt.current && firstMountedAt.current < Date.now() - DELAY) {
      submitForm();
    } else if (!firstMountedAt.current) {
      firstMountedAt.current = Date.now();
    }
  }, [submitForm, values]);

  return null;
};

const FilterForm = ({ filters, activeFilter }) => {
  const { push } = useLocation();
  return (
    <Formik
      initialValues={activeFilter}
      onSubmit={async (values) => {
        const nextSearch = buildQueryString(values);
        const nextPath = nextSearch
          ? `${window.location.pathname}?${nextSearch}`
          : window.location.pathname;
        console.log("nextPath", nextPath);
        push(nextPath);
      }}
      enableReinitialize // allows initialValues to update
    >
      {(formik) => (
        <form className="FilterForm" onSubmit={formik.handleSubmit}>
          <SubmitOnChange />
          {filters.map((filter, filterIndex) => (
            <FilterCheckboxGroup key={filterIndex} filter={filter} />
          ))}
        </form>
      )}
    </Formik>
  );
};

export default FilterForm;
