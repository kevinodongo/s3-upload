"use client";
import AWS from "aws-sdk";
import toast, { Toaster } from "react-hot-toast";
import { Listbox, Transition } from "@headlessui/react";
import { PaperClipIcon } from "@heroicons/react/24/solid";
import { ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { ChangeEvent, Fragment, useState, useRef } from "react";

AWS.config.update({
  region: "us-east-1",
  credentials: {
    accessKeyId: "",
    secretAccessKey: "",
  },
});

const bucketName = "";

interface BranchType {
  id: number;
  name: string;
}

interface CompanyType extends BranchType {
  branches: BranchType[];
}

interface CountryType extends BranchType {
  businesses: CountryType[];
}

const DATA = [
  {
    id: 1,
    name: "Kenya",
    businesses: [
      { id: 1, name: "Zillow", branches: [{ id: 2, name: "Nairobi" }] },
      {
        id: 2,
        name: "Car 24",
        branches: [
          { id: 1, name: "Nairobi" },
          { id: 2, name: "Nakuru" },
        ],
      },
    ],
  },
  {
    id: 2,
    name: "Uganda",
    businesses: [
      {
        id: 1,
        name: "Zillow",
        branches: [
          { id: 1, name: "Kampala" },
          { id: 2, name: "Tororo" },
          { id: 3, name: "Jinja" },
        ],
      },
      { id: 2, name: "Olx", branches: [{ id: 1, name: "Kampala" }] },
    ],
  },
];

function classNames(...classes: any) {
  return classes.filter(Boolean).join(" ");
}

export default function Home() {
  const [selectedCountry, setSelectedCountry] = useState<CountryType | null>(
    null
  );
  const [selectedCompany, setSelectedCompany] = useState<CompanyType | null>(
    null
  );
  const [selectedBranch, setSelectedBranch] = useState<BranchType | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const results = Array.from(files);
      setSelectedFiles([...selectedFiles, ...results]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    const updatedFiles = [...selectedFiles];
    updatedFiles.splice(index, 1);
    setSelectedFiles(updatedFiles);
  };

  const submitForm = async () => {
    if (selectedFiles.length === 0 || !selectedCountry || !selectedCompany) {
      if (selectedFiles.length === 0) {
        toast.error("Please select files to upload.");
      }
      if (!selectedCountry) {
        toast.error("Please select a country");
      }
      if (!selectedCompany) {
        toast.error("Please select a company");
      }
      return;
    }

    await Promise.all(
      selectedFiles.map(async (file) => {
        const fileName = `${encodeURIComponent(
          selectedCountry?.name
        )}/${encodeURIComponent(selectedCompany?.name)}${
          selectedBranch ? `/${encodeURIComponent(selectedBranch.name)}` : ""
        }/${encodeURIComponent(file.name)}`;
        const params = {
          Bucket: bucketName,
          Key: fileName,
          Body: file,
        };
        await toast.promise(uploadToS3(params), {
          loading: "Uploading files...",
          success: "File uploaded successfully!",
          error: "Error uploading file",
        });
      })
    );

    resetFields();
  };

  const resetFields = () => {
    setSelectedCountry(null);
    setSelectedCompany(null);
    setSelectedBranch(null);
    setSelectedFiles([]);
  };

  const uploadToS3 = (params: any) => {
    return new Promise<void>((resolve, reject) => {
      var upload = new AWS.S3.ManagedUpload({
        params: params,
      });

      const promise = upload.promise();
      promise.then(
        function (data) {
          resolve();
        },
        function (err) {
          reject(new Error(err));
        }
      );
    });
  };

  return (
    <>
      <Toaster />
      <div className="flex h-screen flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-10 bg-white p-10 rounded-xl shadow">
          <form className="space-y-6" action="#" method="POST">
            <div>
              <DropDown
                title="Country"
                items={DATA}
                selected={selectedCountry}
                setSelected={setSelectedCountry}
              />
            </div>
            {selectedCountry && (
              <div>
                <DropDown
                  title="Business / Company"
                  items={selectedCountry.businesses}
                  selected={selectedCompany}
                  setSelected={setSelectedCompany}
                />
              </div>
            )}
            {selectedCompany && (
              <div>
                <DropDown
                  title="Branches"
                  items={selectedCompany.branches}
                  selected={selectedBranch}
                  setSelected={setSelectedBranch}
                />
              </div>
            )}

            {selectedFiles.length > 0 && (
              <ul
                role="list"
                className="divide-y divide-gray-100 rounded-md border border-gray-200"
              >
                {selectedFiles.map((file, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between py-4 pl-4 pr-5 text-sm leading-6"
                  >
                    <div className="flex w-0 flex-1 items-center">
                      <PaperClipIcon
                        className="h-5 w-5 flex-shrink-0 text-gray-400"
                        aria-hidden="true"
                      />
                      <div className="ml-4 flex min-w-0 flex-1 gap-2">
                        <span className="truncate font-medium">
                          {file.name}
                        </span>
                        <span className="flex-shrink-0 text-gray-400">
                          {file.size}mb
                        </span>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <a
                        onClick={() => removeFile(index)}
                        className="font-medium cursor-pointer text-red-600 hover:text-red-500"
                      >
                        Remove
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div>
              <input
                multiple
                ref={fileInputRef}
                onChange={handleFileInputChange}
                className="relative m-0 block w-full min-w-0 flex-auto cursor-pointer rounded-md border border-solid border-secondary-500 bg-transparent bg-clip-padding px-3 py-[0.32rem] text-sm font-normal leading-[2.15] text-surface transition duration-300 ease-in-out file:-mx-3 file:-my-[0.32rem] file:me-3 file:cursor-pointer file:overflow-hidden file:rounded-none file:border-0 file:border-e file:border-solid file:border-inherit file:bg-transparent file:px-3  file:py-[0.32rem] file:text-surface focus:border-primary focus:text-gray-700 focus:shadow-inset focus:outline-none dark:border-white/70 dark:text-white  file:dark:text-white"
                aria-describedby="file_input_help"
                id="file_input"
                type="file"
              />
            </div>

            <div>
              <button
                type="button"
                onClick={submitForm}
                className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2.5 text-sm font-semibold leading-6 text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

interface DropDownProps {
  title: string;
  items: any[];
  selected: any;
  setSelected: (value: any) => void;
}

function DropDown({ title, items, selected, setSelected }: DropDownProps) {
  return (
    <Listbox value={selected} onChange={setSelected}>
      {({ open }) => (
        <>
          <Listbox.Label className="block text-sm font-medium leading-6 text-gray-900">
            {title}
          </Listbox.Label>
          <div className="relative mt-2">
            <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6">
              <span className="block truncate">
                {selected ? selected.name : "-- Please choose an option --"}
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronUpDownIcon
                  className="h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
              </span>
            </Listbox.Button>

            <Transition
              show={open}
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {items.map((item) => (
                  <Listbox.Option
                    key={item.id}
                    className={({ active }) =>
                      classNames(
                        active ? "bg-indigo-600 text-white" : "text-gray-900",
                        "relative cursor-default select-none py-2 pl-3 pr-9"
                      )
                    }
                    value={item}
                  >
                    {({ selected, active }) => (
                      <>
                        <span
                          className={classNames(
                            selected ? "font-semibold" : "font-normal",
                            "block truncate"
                          )}
                        >
                          {item?.name}
                        </span>
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </>
      )}
    </Listbox>
  );
}
