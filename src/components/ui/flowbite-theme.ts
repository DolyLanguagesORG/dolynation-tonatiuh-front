import { createTheme } from "flowbite-react";

/**
 * Tema personalizado de `flowbite-react` alineado con las variables generadas
 * por el MCP de Flowbite (`@theme`) y la estética estrictamente Blanco y Negro
 * de los wireframes de DolyNation.
 *
 * Únicas excepciones con color dinámico: estados semánticos `success`, `warning` y `danger` (`failure`).
 */
export const dolyFlowbiteTheme = createTheme({
  button: {
    base: "relative inline-flex items-center justify-center gap-2 rounded-base font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring focus:ring-0",
    disabled: "cursor-not-allowed opacity-50 pointer-events-none",
    fullSized: "w-full",
    size: {
      xs: "min-h-7 px-2.5 py-1 text-[11px] tracking-wider uppercase",
      sm: "min-h-8 px-3 py-1.5 text-xs tracking-wider uppercase",
      md: "min-h-11 px-4 py-2.5 text-xs tracking-wider uppercase",
      lg: "min-h-12 px-6 py-3 text-sm tracking-wide",
      xl: "min-h-12 px-6 py-3.5 text-base tracking-wide",
    },
    color: {
      /* Botones estándar estrictamente en Blanco y Negro */
      default:
        "bg-brand text-white border border-brand hover:bg-brand-strong hover:border-brand-strong hover:text-white focus:ring-0 dark:bg-brand dark:text-white dark:border-brand dark:hover:bg-brand-strong",
      dark: "bg-brand text-white border border-brand hover:bg-brand-strong hover:border-brand-strong hover:text-white focus:ring-0 dark:bg-brand dark:text-white dark:border-brand dark:hover:bg-brand-strong",
      light:
        "bg-neutral-primary-soft text-heading border border-default-medium hover:bg-neutral-secondary-medium hover:border-brand hover:text-heading focus:ring-0 dark:bg-neutral-primary-soft dark:text-heading dark:border-default-medium dark:hover:bg-neutral-secondary-medium",
      alternative:
        "bg-neutral-primary-soft text-heading border border-brand hover:bg-brand hover:text-white hover:border-brand focus:ring-0 dark:bg-neutral-primary-soft dark:text-heading dark:border-brand dark:hover:bg-brand dark:hover:text-white",
      gray: "bg-transparent text-heading border border-transparent hover:bg-neutral-secondary-medium hover:text-heading focus:ring-0 dark:bg-transparent dark:text-heading dark:hover:bg-neutral-secondary-medium",
      /* Variantes semánticas dinámicas (success, warning, danger) */
      success:
        "bg-success text-white border border-success hover:bg-success-strong hover:border-success-strong focus:ring-0 dark:bg-success dark:text-white",
      green:
        "bg-success text-white border border-success hover:bg-success-strong hover:border-success-strong focus:ring-0 dark:bg-success dark:text-white",
      warning:
        "bg-warning text-white border border-warning hover:bg-warning-strong hover:border-warning-strong focus:ring-0 dark:bg-warning dark:text-white",
      yellow:
        "bg-warning text-white border border-warning hover:bg-warning-strong hover:border-warning-strong focus:ring-0 dark:bg-warning dark:text-white",
      failure:
        "bg-danger text-white border border-danger hover:bg-danger-strong hover:border-danger-strong focus:ring-0 dark:bg-danger dark:text-white",
      red: "bg-danger text-white border border-danger hover:bg-danger-strong hover:border-danger-strong focus:ring-0 dark:bg-danger dark:text-white",
    },
  },
  card: {
    root: {
      base: "flex rounded-base border border-default bg-neutral-primary-soft text-heading shadow-none transition-colors dark:border-default dark:bg-neutral-primary-soft dark:text-heading",
      children: "flex h-full flex-col justify-center gap-4 p-5 sm:p-6",
      href: "hover:bg-neutral-secondary-medium dark:hover:bg-neutral-secondary-medium",
    },
  },
  alert: {
    base: "flex flex-col gap-2 rounded-base border p-4 sm:p-5 text-sm",
    rounded: "rounded-base",
    color: {
      /* Info y neutros en Blanco y Negro */
      info: "bg-neutral-secondary-medium border-brand text-heading dark:bg-neutral-secondary-medium dark:border-brand dark:text-heading",
      gray: "bg-neutral-secondary-medium border-default-medium text-heading dark:bg-neutral-secondary-medium dark:border-default-medium dark:text-heading",
      dark: "bg-brand border-brand text-white dark:bg-brand dark:border-brand dark:text-white",
      light:
        "bg-neutral-primary-soft border-default-medium text-heading dark:bg-neutral-primary-soft dark:border-default-medium dark:text-heading",
      /* Únicas alertas con color dinámico: success, warning y danger (failure) */
      success:
        "bg-success-soft border-success-subtle text-fg-success-strong dark:bg-success-soft dark:border-success-subtle dark:text-fg-success-strong",
      warning:
        "bg-warning-soft border-warning-subtle text-fg-warning dark:bg-warning-soft dark:border-warning-subtle dark:text-fg-warning",
      failure:
        "bg-danger-soft border-danger-subtle text-fg-danger-strong dark:bg-danger-soft dark:border-danger-subtle dark:text-fg-danger-strong",
    },
  },
  badge: {
    root: {
      base: "inline-flex h-fit items-center gap-1 rounded-base border px-2 py-0.5 font-sans text-[11px] font-bold tracking-wider uppercase",
      color: {
        /* Badges estándar en Blanco y Negro */
        dark: "bg-brand text-white border-brand hover:bg-brand-strong dark:bg-brand dark:text-white dark:border-brand",
        gray: "bg-neutral-secondary-medium text-heading border-default-medium hover:bg-neutral-tertiary-medium dark:bg-neutral-secondary-medium dark:text-heading dark:border-default-medium",
        light:
          "bg-neutral-primary-soft text-heading border-brand hover:bg-neutral-secondary-medium dark:bg-neutral-primary-soft dark:text-heading dark:border-brand",
        info: "bg-neutral-secondary-medium text-heading border-default-medium dark:bg-neutral-secondary-medium dark:text-heading",
        /* Badges semánticos dinámicos: success, warning, failure (danger) */
        success:
          "bg-success-soft text-fg-success-strong border-success-subtle hover:bg-success-medium dark:bg-success-soft dark:text-fg-success-strong",
        warning:
          "bg-warning-soft text-fg-warning border-warning-subtle hover:bg-warning-medium dark:bg-warning-soft dark:text-fg-warning",
        failure:
          "bg-danger-soft text-fg-danger-strong border-danger-subtle hover:bg-danger-medium dark:bg-danger-soft dark:text-fg-danger-strong",
      },
    },
  },
  textInput: {
    field: {
      base: "relative w-full",
      input: {
        base: "block w-full min-h-12 rounded-base border px-3.5 py-2.5 text-base transition-colors duration-150 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:bg-neutral-tertiary/60 disabled:text-fg-disabled disabled:opacity-70",
        sizes: {
          sm: "p-2 text-sm",
          md: "px-3.5 py-2.5 text-base",
          lg: "p-4 text-base",
        },
        colors: {
          /* Estado normal y foco en Blanco y Negro */
          gray: "border-default-medium bg-neutral-secondary-medium text-heading placeholder:text-body-subtle hover:border-brand focus:bg-neutral-primary-soft focus:border-brand focus:ring-0 dark:border-default-medium dark:bg-neutral-secondary-medium dark:text-heading dark:placeholder:text-body-subtle dark:focus:bg-neutral-primary-soft dark:focus:border-brand",
          info: "border-brand bg-neutral-primary-soft text-heading placeholder:text-body-subtle focus:border-brand focus:ring-0 dark:border-brand dark:bg-neutral-primary-soft dark:text-heading",
          /* Estados dinámicos semánticos: failure (danger), warning, success */
          failure:
            "border-danger bg-danger-soft/60 text-heading placeholder:text-body-subtle focus:border-danger focus:ring-0 dark:border-danger dark:bg-danger-soft/60 dark:text-heading",
          warning:
            "border-warning bg-warning-soft/60 text-heading placeholder:text-body-subtle focus:border-warning focus:ring-0 dark:border-warning dark:bg-warning-soft/60 dark:text-heading",
          success:
            "border-success bg-success-soft/60 text-heading placeholder:text-body-subtle focus:border-success focus:ring-0 dark:border-success dark:bg-success-soft/60 dark:text-heading",
        },
        withAddon: {
          off: "rounded-base",
          on: "rounded-r-base",
        },
      },
    },
  },
  label: {
    root: {
      base: "text-xs font-semibold tracking-wide text-heading",
      disabled: "opacity-60",
      colors: {
        default: "text-heading dark:text-heading",
        info: "text-heading dark:text-heading",
        failure: "text-fg-danger dark:text-fg-danger",
        warning: "text-fg-warning dark:text-fg-warning",
        success: "text-fg-success dark:text-fg-success",
      },
    },
  },
  helperText: {
    root: {
      base: "text-xs leading-relaxed",
      colors: {
        gray: "text-body dark:text-body",
        info: "text-heading dark:text-heading",
        failure: "text-fg-danger font-medium dark:text-fg-danger",
        warning: "text-fg-warning font-medium dark:text-fg-warning",
        success: "text-fg-success font-medium dark:text-fg-success",
      },
    },
  },
  checkbox: {
    base: "h-4 w-4 shrink-0 cursor-pointer appearance-none rounded-xxs border border-default-medium bg-neutral-secondary-medium bg-[length:0.65em_0.65em] bg-center bg-no-repeat accent-brand transition-colors checked:border-brand checked:bg-brand checked:bg-check-icon hover:border-brand focus:outline-none focus:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60 dark:border-default-medium dark:bg-neutral-secondary-medium dark:checked:border-brand dark:checked:bg-brand",
    color: {
      default:
        "text-brand checked:border-brand checked:bg-brand focus:ring-0 dark:checked:border-brand dark:checked:bg-brand",
      dark: "text-brand checked:border-brand checked:bg-brand focus:ring-0 dark:checked:border-brand dark:checked:bg-brand",
      gray: "text-brand checked:border-brand checked:bg-brand focus:ring-0 dark:checked:border-brand dark:checked:bg-brand",
      failure:
        "border-danger text-danger checked:border-danger checked:bg-danger focus:ring-0 dark:border-danger dark:checked:border-danger dark:checked:bg-danger",
      success:
        "border-success text-success checked:border-success checked:bg-success focus:ring-0 dark:border-success dark:checked:border-success dark:checked:bg-success",
      warning:
        "border-warning text-warning checked:border-warning checked:bg-warning focus:ring-0 dark:border-warning dark:checked:border-warning dark:checked:bg-warning",
    },
    indeterminate:
      "border-brand bg-brand bg-dash-icon dark:border-brand dark:bg-brand",
  },
  sidebar: {
    root: {
      base: "h-full w-full bg-neutral-primary-soft text-heading",
      collapsed: {
        on: "w-16",
        off: "w-full",
      },
      inner:
        "flex h-full flex-col justify-between overflow-y-auto overflow-x-hidden rounded-none bg-neutral-primary-soft text-heading p-0 dark:bg-neutral-primary-soft dark:text-heading",
    },
    items: {
      base: "flex flex-col",
    },
    itemGroup: {
      base: "flex flex-col gap-1 border-0 p-0 first:mt-0 first:pt-0 dark:border-default",
    },
    item: {
      base: "flex items-center justify-start rounded-base p-2 text-sm font-medium text-body hover:bg-neutral-secondary-medium hover:text-heading dark:text-body dark:hover:bg-neutral-secondary-medium dark:hover:text-heading",
      active:
        "bg-neutral-secondary-medium font-semibold text-heading dark:bg-neutral-secondary-medium dark:text-heading",
      icon: {
        base: "h-4 w-4 shrink-0 text-body transition duration-75 group-hover:text-heading dark:text-body dark:group-hover:text-heading",
        active: "text-heading dark:text-heading",
      },
    },
  },
  drawer: {
    root: {
      base: "fixed z-40 overflow-y-auto bg-neutral-primary-soft text-heading p-0 transition-transform dark:bg-neutral-primary-soft dark:text-heading",
      backdrop: "fixed inset-0 z-30 bg-brand/40 backdrop-blur-[1px]",
    },
  },
  footer: {
    root: {
      base: "mt-auto w-full rounded-none border-t border-default bg-neutral-primary-soft text-heading px-4 py-5 shadow-none sm:px-6 lg:px-10 dark:bg-neutral-primary-soft dark:text-heading",
    },
    groupLink: {
      base: "flex flex-wrap text-body dark:text-body",
    },
  },
  textarea: {
    base: "block w-full rounded-base border p-3.5 text-sm leading-relaxed transition-colors duration-150 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:bg-neutral-tertiary/60 disabled:text-fg-disabled disabled:opacity-70",
    colors: {
      gray: "border-default-medium bg-neutral-primary-soft text-heading placeholder:text-body-subtle hover:border-brand focus:border-brand focus:ring-0 dark:border-default-medium dark:bg-neutral-primary-soft dark:text-heading dark:placeholder:text-body-subtle dark:focus:border-brand",
      info: "border-brand bg-neutral-primary-soft text-heading placeholder:text-body-subtle focus:border-brand focus:ring-0 dark:border-brand dark:bg-neutral-primary-soft dark:text-heading",
      failure:
        "border-danger bg-danger-soft/60 text-heading placeholder:text-body-subtle focus:border-danger focus:ring-0 dark:border-danger dark:bg-danger-soft/60 dark:text-heading",
      warning:
        "border-warning bg-warning-soft/60 text-heading placeholder:text-body-subtle focus:border-warning focus:ring-0 dark:border-warning dark:bg-warning-soft/60 dark:text-heading",
      success:
        "border-success bg-success-soft/60 text-heading placeholder:text-body-subtle focus:border-success focus:ring-0 dark:border-success dark:bg-success-soft/60 dark:text-heading",
    },
    withShadow: {
      on: "shadow-none",
      off: "shadow-none",
    },
  },
  select: {
    base: "flex",
    addon:
      "inline-flex items-center rounded-l-base border border-r-0 border-default-medium bg-neutral-secondary-medium px-3 text-xs font-semibold text-body",
    field: {
      base: "relative w-full",
      icon: {
        base: "pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-body",
        svg: "h-4 w-4 text-body",
      },
      select: {
        base: "block w-full cursor-pointer appearance-none rounded-base border pr-9 font-sans font-medium transition-colors duration-150 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:bg-neutral-tertiary/60 disabled:text-fg-disabled disabled:opacity-70",
        withIcon: {
          on: "pl-10",
          off: "",
        },
        withAddon: {
          on: "rounded-r-base",
          off: "rounded-base",
        },
        withShadow: {
          on: "shadow-none",
          off: "shadow-none",
        },
        sizes: {
          sm: "min-h-8 px-3 py-1.5 pr-8 text-[11px] font-bold tracking-wider uppercase",
          md: "min-h-11 px-3.5 py-2.5 pr-9 text-sm",
          lg: "min-h-12 px-4 py-3 pr-10 text-base",
        },
        colors: {
          gray: "border-default-medium bg-neutral-primary-soft text-heading hover:border-brand focus:border-brand focus:ring-0 dark:border-default-medium dark:bg-neutral-primary-soft dark:text-heading dark:focus:border-brand",
          info: "border-brand bg-neutral-primary-soft text-heading focus:border-brand focus:ring-0 dark:border-brand dark:bg-neutral-primary-soft dark:text-heading",
          failure:
            "border-danger bg-danger-soft/60 text-heading focus:border-danger focus:ring-0 dark:border-danger dark:bg-danger-soft/60 dark:text-heading",
          warning:
            "border-warning bg-warning-soft/60 text-heading focus:border-warning focus:ring-0 dark:border-warning dark:bg-warning-soft/60 dark:text-heading",
          success:
            "border-success bg-success-soft/60 text-heading focus:border-success focus:ring-0 dark:border-success dark:bg-success-soft/60 dark:text-heading",
        },
      },
    },
  },
  progress: {
    base: "w-full overflow-hidden rounded-none bg-neutral-secondary-medium dark:bg-neutral-secondary-medium",
    label: "mb-1 flex justify-between text-xs font-semibold text-heading",
    bar: "rounded-none transition-all duration-300",
    color: {
      default: "bg-brand dark:bg-brand",
      dark: "bg-brand dark:bg-brand",
      gray: "bg-body-subtle dark:bg-body-subtle",
      green: "bg-success dark:bg-success",
      yellow: "bg-warning dark:bg-warning",
      red: "bg-danger dark:bg-danger",
    },
    size: {
      sm: "h-1",
      md: "h-1.5",
      lg: "h-2.5",
      xl: "h-3.5",
    },
  },
  table: {
    root: {
      base: "w-full text-left text-sm text-body",
      shadow: "",
      wrapper: "relative w-full overflow-x-auto",
    },
    head: {
      base: "border-y border-default bg-neutral-secondary-medium text-[10px] font-bold tracking-widest text-muted uppercase dark:bg-neutral-secondary-medium dark:text-muted",
      cell: {
        base: "px-4 py-3 font-bold",
      },
    },
    row: {
      base: "border-b border-default last:border-b-0 transition-colors",
      hovered: "hover:bg-neutral-secondary-soft dark:hover:bg-neutral-secondary-soft",
      striped: "even:bg-neutral-secondary-soft/40",
    },
    body: {
      base: "divide-y divide-default",
      cell: {
        base: "px-4 py-4 align-middle",
      },
    },
  },
});
