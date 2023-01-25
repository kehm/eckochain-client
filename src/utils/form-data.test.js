import { v4 as uuidv4 } from 'uuid';
import { customAlphabet } from 'nanoid';
import { createDatasetId, parseFormData } from './form-data';

jest.mock('uuid');
jest.mock('nanoid');

uuidv4.mockReturnValue('81b5ff16-87fc-4dec-85e6-8f9fb46e68c3');
customAlphabet.mockReturnValue(jest.fn(() => '940881'));

afterEach(() => {
    jest.clearAllMocks();
});

describe('call function parseFormData', () => {
    describe('with parameters with leading and trailing whitespace', () => {
        test('should return parameters without leading and trailing whitespace', () => {
            const data = {
                survey: 'ORIGINAL',
                description: 'test description ',
                terms: ' terms are here',
                locationRemarks: ' location remarks ',
            };
            const formData = parseFormData(data);
            expect(formData.survey).toEqual('ORIGINAL');
            expect(formData.description).toEqual('test description');
            expect(formData.terms).toEqual('terms are here');
            expect(formData.locationRemarks).toEqual('location remarks');
        });
    });
});

describe('call function createDatasetId', () => {
    describe('with an original survey', () => {
        test('should return dataset and policy IDs', () => {
            const data = {
                survey: 'ORIGINAL',
                earliestYearCollected: 2020,
                latestYearCollected: 2021,
                countries: ['NO', 'DE'],
            };
            const datasetId = createDatasetId(data);
            expect(datasetId).toEqual('OS-2020-2021-NO-940881');
        });
    });
    describe('with a resurvey', () => {
        test('should return dataset and policy IDs', () => {
            const data = {
                survey: 'RESURVEY',
                earliestYearCollected: 2020,
                latestYearCollected: 2021,
                countries: ['NO', 'DE'],
            };
            const datasetId = createDatasetId(data);
            expect(datasetId).toEqual('RE-2020-2021-NO-940881');
        });
    });
    describe('with a combination survey', () => {
        test('should return dataset and policy IDs', () => {
            const data = {
                survey: 'COMBINATION',
                earliestYearCollected: 2020,
                latestYearCollected: 2021,
                countries: ['NO', 'DE'],
            };
            const datasetId = createDatasetId(data);
            expect(datasetId).toEqual('CO-2020-2021-NO-940881');
        });
    });
    describe('with a missing countries array', () => {
        test('should return dataset and policy IDs', () => {
            const data = {
                survey: 'COMBINATION',
                earliestYearCollected: 2020,
                latestYearCollected: 2021,
            };
            const datasetId = createDatasetId(data);
            expect(datasetId).toEqual('CO-2020-2021-NULL-940881');
        });
    });
    describe('with no latest year', () => {
        test('should return dataset and policy IDs', () => {
            const data = {
                survey: 'COMBINATION',
                earliestYearCollected: 2020,
            };
            const datasetId = createDatasetId(data);
            expect(datasetId).toEqual('CO-2020-NULL-940881');
        });
    });
});
